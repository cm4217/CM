/**
 * Content script: optional floating hint when selection looks like a drug name / CAS.
 * Does not scrape monograph full text — only helps jump to the index site.
 */
(function () {
  const CAS_RE = /^\d{2,7}-\d{2}-\d$/;
  let tip;

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.id = "pharm-cm-lookup-tip";
    tip.setAttribute("role", "status");
    Object.assign(tip.style, {
      position: "fixed",
      zIndex: "2147483646",
      bottom: "16px",
      right: "16px",
      maxWidth: "280px",
      padding: "8px 10px",
      borderRadius: "8px",
      background: "#0f766e",
      color: "#fff",
      font: "12px/1.4 system-ui, sans-serif",
      boxShadow: "0 4px 16px rgba(15,23,42,.25)",
      display: "none",
      cursor: "pointer",
    });
    tip.addEventListener("click", () => {
      const q = tip.dataset.q || "";
      if (!q) return;
      chrome.runtime.sendMessage({ type: "lookup", q }, () => {
        /* popup / SW handles; also open search via context menu path */
      });
      chrome.storage.sync.get({ apiBase: "http://localhost:3000" }, (cfg) => {
        const base = String(cfg.apiBase || "http://localhost:3000").replace(/\/$/, "");
        window.open(`${base}/search?q=${encodeURIComponent(q)}`, "_blank");
      });
      tip.style.display = "none";
    });
    document.documentElement.appendChild(tip);
    return tip;
  }

  function onSelectionChange() {
    const t = (window.getSelection() || "").toString().trim().slice(0, 80);
    if (!t || t.length < 2) {
      if (tip) tip.style.display = "none";
      return;
    }
    // Avoid huge paragraph selections
    if (t.length > 64 || /\n/.test(t)) {
      if (tip) tip.style.display = "none";
      return;
    }
    const looksUseful =
      CAS_RE.test(t) ||
      /[\u4e00-\u9fff]{2,}/.test(t) ||
      /^[A-Za-z][A-Za-z0-9 \-]{2,40}$/.test(t);
    if (!looksUseful) {
      if (tip) tip.style.display = "none";
      return;
    }
    const el = ensureTip();
    el.dataset.q = t;
    el.textContent = "药典对照层：检索「" + t + "」（点击打开）";
    el.style.display = "block";
  }

  document.addEventListener("mouseup", () => setTimeout(onSelectionChange, 50));
  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape" && tip) tip.style.display = "none";
  });
})();
