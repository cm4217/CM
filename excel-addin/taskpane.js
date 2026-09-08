/* global Office, Excel */
(function () {
  var DEFAULT_BASE = "http://localhost:3000";

  function $(id) { return document.getElementById(id); }

  function setStatus(msg, cls) {
    var el = $("status");
    el.textContent = msg;
    el.className = cls || "";
  }

  function loadBase() {
    try {
      return localStorage.getItem("pharm_excel_api_base") || DEFAULT_BASE;
    } catch (e) {
      return DEFAULT_BASE;
    }
  }

  function saveBase(v) {
    try { localStorage.setItem("pharm_excel_api_base", v); } catch (e) {}
  }

  async function lookup(q, base) {
    var url = base.replace(/\/$/, "") + "/api/lookup?q=" + encodeURIComponent(q);
    var res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function formatRow(r) {
    if (!r || !r.found) return [r && r.query ? r.query : "", "未找到", "", "", "", ""];
    return [
      r.nameZh || "",
      r.nameEn || "",
      r.cas || "",
      r.unii || "",
      (r.pharmacopoeias || []).join(";"),
      r.id || "",
    ];
  }

  async function writeSelection(values) {
    return Excel.run(async function (context) {
      var range = context.workbook.getSelectedRange();
      range.values = values;
      range.format.autofitColumns();
      await context.sync();
    });
  }

  async function onLookup(write) {
    var q = ($("q").value || "").trim();
    var base = ($("apiBase").value || DEFAULT_BASE).trim();
    var mode = $("mode").value;
    if (!q) { setStatus("请输入查询词", "err"); return; }
    saveBase(base);
    $("lookupBtn").disabled = true;
    $("lookupOnlyBtn").disabled = true;
    setStatus("查询中…");
    try {
      var data = await lookup(q, base);
      var r = (data.results && data.results[0]) || { found: false, query: q };
      if (!write) {
        setStatus(JSON.stringify(r, null, 2), r.found ? "ok" : "err");
        return;
      }
      var values;
      if (mode === "cas") values = [[r.cas || ""]];
      else if (mode === "nameZh") values = [[r.nameZh || ""]];
      else if (mode === "json") values = [[JSON.stringify(r)]];
      else values = [formatRow(r)];
      await writeSelection(values);
      setStatus(r.found ? "已写入选区：" + (r.nameZh || r.nameEn || r.id) : "未找到，已写入占位行", r.found ? "ok" : "err");
    } catch (e) {
      setStatus(String(e && e.message ? e.message : e), "err");
    } finally {
      $("lookupBtn").disabled = false;
      $("lookupOnlyBtn").disabled = false;
    }
  }

  Office.onReady(function (info) {
    $("apiBase").value = loadBase();
    if (info.host === Office.HostType.Excel) {
      $("lookupBtn").onclick = function () { onLookup(true); };
      $("lookupOnlyBtn").onclick = function () { onLookup(false); };
    } else {
      setStatus("请在 Excel 中通过加载项侧载打开本任务窗格。浏览器预览可点「仅查询」。", "muted");
      $("lookupBtn").onclick = function () { onLookup(false); };
      $("lookupOnlyBtn").onclick = function () { onLookup(false); };
    }
  });
})();
