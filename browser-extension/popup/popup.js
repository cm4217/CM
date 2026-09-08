const DEFAULT_BASE = "http://localhost:3000";

function $(id) { return document.getElementById(id); }

async function getBase() {
  const { apiBase } = await chrome.storage.sync.get({ apiBase: DEFAULT_BASE });
  return String(apiBase || DEFAULT_BASE).replace(/\/$/, "");
}

function formatResult(r) {
  if (!r) return "无结果";
  if (!r.found) return `未找到：${r.query || ""}`;
  return [
    r.nameZh || "",
    r.nameEn || "",
    r.cas ? "CAS " + r.cas : "",
    r.unii ? "UNII " + r.unii : "",
    (r.pharmacopoeias || []).join(", "),
    r.id || "",
  ].filter(Boolean).join("\n");
}

async function runLookup(openPage) {
  const q = ($("q").value || "").trim();
  const base = await getBase();
  $("err").hidden = true;
  $("out").hidden = true;
  if (!q) {
    $("err").hidden = false;
    $("err").textContent = "请输入查询词";
    return;
  }
  if (openPage) {
    chrome.tabs.create({ url: `${base}/search?q=${encodeURIComponent(q)}` });
    return;
  }
  $("lookup").disabled = true;
  try {
    const res = await chrome.runtime.sendMessage({ type: "lookup", q });
    if (!res?.ok) throw new Error(res?.error || "lookup failed");
    const r = (res.data?.results && res.data.results[0]) || { found: false, query: q };
    $("out").hidden = false;
    $("out").textContent = formatResult(r);
  } catch (e) {
    $("err").hidden = false;
    $("err").textContent = String(e.message || e);
  } finally {
    $("lookup").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const base = await getBase();
  $("baseLabel").textContent = base;
  $("opts").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  $("lookup").addEventListener("click", () => runLookup(false));
  $("openSearch").addEventListener("click", () => runLookup(true));
  $("q").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runLookup(false);
  });
  // Prefill from active tab selection
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => (window.getSelection() || "").toString().trim().slice(0, 80),
      });
      if (result) $("q").value = String(result);
    }
  } catch (_) { /* restricted pages */ }
  $("q").focus();
});
