const DEFAULT_BASE = "http://localhost:3000";

async function load() {
  const { apiBase } = await chrome.storage.sync.get({ apiBase: DEFAULT_BASE });
  document.getElementById("apiBase").value = apiBase || DEFAULT_BASE;
}

async function save() {
  let v = (document.getElementById("apiBase").value || "").trim() || DEFAULT_BASE;
  v = v.replace(/\/$/, "");
  await chrome.storage.sync.set({ apiBase: v });
  document.getElementById("status").textContent = "已保存：" + v;
}

async function test() {
  const base = (document.getElementById("apiBase").value || DEFAULT_BASE).replace(/\/$/, "");
  const status = document.getElementById("status");
  status.textContent = "测试中…";
  try {
    const res = await fetch(base + "/api/lookup?q=" + encodeURIComponent("aspirin"));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    const n = Array.isArray(json.results) ? json.results.length : 0;
    status.textContent = "OK · results=" + n;
  } catch (e) {
    status.textContent = "失败：" + (e.message || e);
  }
}

document.getElementById("save").addEventListener("click", () => void save());
document.getElementById("test").addEventListener("click", () => void test());
load();
