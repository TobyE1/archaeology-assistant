// materialCapture.js
// Minimal two-step capture flow for Material Storage
// Requires: materials.json in same folder

(() => {
  const IMG1_CONTAINER = document.getElementById("img1container");
  const IMG2_CONTAINER = document.getElementById("img2container");
  const BTN_CAPTURE1 = document.getElementById("btn-capture1");
  const BTN_CAPTURE2 = document.getElementById("btn-capture2");
  const BTN_MERGE = document.getElementById("btn-merge");
  const MATERIALS_FORM = document.getElementById("materialsForm");
  const MANUAL_AREA = document.getElementById("manualTableArea");
  const MSG = document.getElementById("message");
  const BTN_EXPORT_CSV = document.getElementById("btn-export-csv");
  const BTN_COPY_TABLE = document.getElementById("btn-copy-table");
  const DOWNLOAD_LINK = document.getElementById("download-link");

  let img1Data = null;
  let img2Data = null;
  let materialsJson = null;

  async function init() {
    try {
      const resp = await fetch('./materials.json');
      materialsJson = await resp.json();
      setMessage("Loaded materials configuration.");
    } catch (e) {
      setMessage("Failed to load materials.json. Make sure file exists.");
      console.error(e);
    }
  }

  function setMessage(txt, isError = false) {
    MSG.textContent = txt || "";
    MSG.style.color = isError ? "#ff6b6b" : "#f5bf00";
  }

  function showImageInContainer(imgDataUrl, container) {
    container.innerHTML = "";
    const img = new Image();
    img.src = imgDataUrl;
    img.style.maxWidth = "100%";
    img.style.display = "block";
    container.appendChild(img);
  }

  async function captureScreen() {
    // This tries to use expected alt1 capture API. If not available, we return null.
    // In Alt1 environment, a1lib.captureHoldFullRs() is commonly used.
    try {
      if (typeof a1lib !== "undefined" && typeof a1lib.captureHoldFullRs === "function") {
        setMessage("Capturing RuneScape screen...");
        const img = await a1lib.captureHoldFullRs();
        // convert to data URL for display
        const dataUrl = img.toDataUrl ? img.toDataUrl() : (await img.getDataUrl());
        return dataUrl;
      } else if (typeof alt1 !== "undefined" && typeof alt1.capture === "function") {
        // fallback if a different API is present
        const img = await alt1.capture();
        return img ? img.toDataUrl() : null;
      } else {
        setMessage("Alt1 capture API not detected in this environment. You must run this inside Alt1.", true);
        return null;
      }
    } catch (err) {
      console.error("capture error:", err);
      setMessage("Capture error: " + (err.message || err), true);
      return null;
    }
  }

  BTN_CAPTURE1.addEventListener("click", async () => {
    setMessage("Please ensure Material Storage is open via the Journal and DO NOT scroll. Then click Capture.");
    const dataUrl = await captureScreen();
    if (dataUrl) {
      img1Data = dataUrl;
      showImageInContainer(dataUrl, IMG1_CONTAINER);
      setMessage("Captured Screen 1.");
      BTN_MERGE.disabled = false;
      checkReadyToMerge();
    }
  });

  BTN_CAPTURE2.addEventListener("click", async () => {
    setMessage("Now scroll in-game so the second window is visible (Dragonkin should remain visible). Then click Capture.");
    const dataUrl = await captureScreen();
    if (dataUrl) {
      img2Data = dataUrl;
      showImageInContainer(dataUrl, IMG2_CONTAINER);
      setMessage("Captured Screen 2.");
      BTN_MERGE.disabled = false;
      checkReadyToMerge();
    }
  });

  function flattenOrderedList(matJson) {
    // returns an array of objects {category, name}
    const out = [];
    for (const cat of Object.keys(matJson)) {
      const list = matJson[cat];
      for (const name of list) out.push({ category: cat, name });
    }
    return out;
  }

  function checkReadyToMerge() {
    // enable manual area if at least one capture present
    if (img1Data || img2Data) {
      MANUAL_AREA.hidden = false;
      populateMaterialsForm();
    }
  }

  function populateMaterialsForm() {
    MATERIALS_FORM.innerHTML = "";
    const ordered = flattenOrderedList(materialsJson);
    // We will create inputs for all materials in order. User fills counts.
    ordered.forEach((entry, idx) => {
      const row = document.createElement("div");
      row.className = "mat-row";
      const label = document.createElement("label");
      label.textContent = `${entry.category} — ${entry.name}`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = "0";
      input.dataset.idx = idx;
      row.appendChild(label);
      row.appendChild(input);
      MATERIALS_FORM.appendChild(row);
    });
  }

  BTN_MERGE.addEventListener("click", () => {
    if (!materialsJson) {
      setMessage("Materials config not loaded.", true);
      return;
    }
    setMessage("Please verify / enter the quantities for each material. When ready, export as CSV.");
    MANUAL_AREA.hidden = false;
  });

  BTN_EXPORT_CSV.addEventListener("click", () => {
    const csv = buildCsvFromForm();
    downloadCsv(csv, "archaeology-materials.csv");
  });

  BTN_COPY_TABLE.addEventListener("click", () => {
    const csv = buildCsvFromForm();
    copyToClipboard(csv);
    setMessage("CSV copied to clipboard (you can paste into Google Sheets).");
  });

  function buildCsvFromForm() {
    const ordered = flattenOrderedList(materialsJson);
    const headers = ["Category", "Material", "Quantity"];
    const rows = [headers.join(",")];

    const inputs = MATERIALS_FORM.querySelectorAll("input");
    inputs.forEach((inp, i) => {
      const qty = inp.value || "0";
      const entry = ordered[i];
      rows.push(csvEscape(entry.category) + "," + csvEscape(entry.name) + "," + csvEscape(qty));
    });

    return rows.join("\n");
  }

  function csvEscape(s) {
    if (typeof s !== "string") s = String(s);
    if (s.includes(",") || s.includes('"')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function downloadCsv(csvText, filename) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    DOWNLOAD_LINK.href = url;
    DOWNLOAD_LINK.download = filename;
    DOWNLOAD_LINK.style.display = "inline";
    DOWNLOAD_LINK.click();
    setMessage("CSV prepared for download.");
    // revoke after a moment
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function copyToClipboard(text) {
    // fallback safe copy
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {}, () => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  // start init
  init();
})();
