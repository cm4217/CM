/**
 * MV3 service worker — context menu + message relay to lookup API.
 */
const DEFAULT_BASE = "http://localhost:3000";

async function getBase() {
  const { apiBase } = await chrome.storage.sync.get({ apiBase: DEFAULT_BASE });
  return String(apiBase || DEFAULT_BASE).replace(/\/$/, "");
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "pharm-lookup",
      title: "药典对照层：检索「%s」",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: "pharm-open-site",
      title: "打开药典对照层检索页",
      contexts: ["selection", "page"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const base = await getBase();
  const q = (info.selectionText || "").trim();
  if (info.menuItemId === "pharm-open-site") {
    const url = q
      ? `${base}/search?q=${encodeURIComponent(q)}`
      : `${base}/search`;
    chrome.tabs.create({ url });
    return;
  }
  if (info.menuItemId === "pharm-lookup" && q) {
    chrome.tabs.create({
      url: `${base}/search?q=${encodeURIComponent(q)}`,
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "lookup-selection") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => (window.getSelection() || "").toString().trim(),
    });
    const base = await getBase();
    const q = String(result || "").trim();
    chrome.tabs.create({
      url: q
        ? `${base}/search?q=${encodeURIComponent(q)}`
        : `${base}/search`,
    });
  } catch (e) {
    console.warn("lookup-selection failed", e);
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "lookup") return;
  (async () => {
    try {
      const base = await getBase();
      const q = String(msg.q || "").trim();
      if (!q) {
        sendResponse({ ok: false, error: "empty query" });
        return;
      }
      const res = await fetch(
        `${base}/api/lookup?q=${encodeURIComponent(q)}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      sendResponse({ ok: true, base, data: json });
    } catch (e) {
      sendResponse({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  })();
  return true; // async
});
