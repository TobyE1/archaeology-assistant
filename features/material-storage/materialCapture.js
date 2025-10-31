// features/material-capture/materialCapture.js
// Defensive, verbose version for debugging + capture flow
console.log("[MSC] script loaded");

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startCapture");
  const capture1Btn = document.getElementById("capture1");
  const capture2Btn = document.getElementById("capture2");
  const statusArea = document.getElementById("statusArea");

  let capture1 = null;
  let capture2 = null;

  function log(...args) {
    console.log("[MSC]", ...args);
  }

  function setStatus(message, cssClass = "") {
    if (statusArea) {
      statusArea.textContent = message;
      statusArea.className = "status-area " + cssClass;
    }
    log("STATUS:", message);
  }

  function isAlt1Present() {
    // a1lib is the common global but alt1 may also exist.
    const present = (typeof a1lib !== "undefined") || (typeof alt1 !== "undefined");
    if (!present) {
      setStatus("⚠️ Alt1 API not detected. Run inside the Alt1 Toolkit.", "error");
      log("Alt1 not detected: typeof a1lib =", typeof a1lib, "typeof alt1 =", typeof alt1);
    }
    return present;
  }

  // Generic capture wrapper that supports different possible return styles
  async function captureHoldFullRsSafe() {
    try {
      if (typeof a1lib !== "undefined" && typeof a1lib.captureHoldFullRs === "function") {
        log("Using a1lib.captureHoldFullRs()");
        const result = a1lib.captureHoldFullRs();
        // Some environments return an object synchronously, others a Promise.
        if (result && typeof result.then === "function") {
          // Promise-like
          const img = await result;
          return img;
        }
        return result;
      }

      // fallback path: check alt1.capture or alt1.captureHold (different alt1 libs vary)
      if (typeof alt1 !== "undefined" && typeof alt1.capture === "function") {
        log("Using alt1.capture()");
        const result = alt1.capture();
        if (result && typeof result.then === "function") {
          const img = await result;
          return img;
        }
        return result;
      }

      // last resort: attempt alt1.rsCapture or alt1.captureHoldFullRs
      if (typeof alt1 !== "undefined" && typeof alt1.captureHoldFullRs === "function") {
        log("Using alt1.captureHoldFullRs()");
        const result = alt1.captureHoldFullRs();
        if (result && typeof result.then === "function") {
          return await result;
        }
        return result;
      }

      setStatus("Alt1 capture API not available (a1lib/alt1 missing).", "error");
      return null;
    } catch (err) {
      setStatus("Capture failed: " + (err && err.message ? err.message : String(err)), "error");
      console.error("[MSC] capture error:", err);
      return null;
    }
  }

  // convert returned "img" from Alt1 to a data URL for display
  async function toDataUrlFromAlt1Image(img) {
    try {
      if (!img) return null;
      // Many alt1 image wrappers implement .toDataUrl() synchronously or as a Promise
      if (typeof img.toDataUrl === "function") {
        const maybe = img.toDataUrl();
        if (maybe && typeof maybe.then === "function") return await maybe;
        return maybe;
      }
      // Some provide getDataUrl()
      if (typeof img.getDataUrl === "function") {
        const maybe = img.getDataUrl();
        if (maybe && typeof maybe.then === "function") return await maybe;
        return maybe;
      }
      // Some alt1 images are plain canvas-like - try toString or blob; fallback to null
      setStatus("Captured image returned in unknown format. Check console for details.", "warn");
      console.warn("[MSC] Unknown alt1 image object:", img);
      return null;
    } catch (err) {
      console.error("[MSC] toDataUrl error:", err);
      return null;
    }
  }

  // UI handlers
  startBtn && startBtn.addEventListener("click", () => {
    if (!isAlt1Present()) return;
    setStatus("Open Material Storage via Journal (do NOT scroll). Click 'Capture Screen 1' when ready.", "info");

    // enable capture1, ensure others disabled
    capture1Btn.disabled = false;
    capture2Btn.disabled = true;

    // start a safety timer for 6s to show the "not progressing" error if user doesn't act
    const timeout = setTimeout(() => {
      // only show error if no interaction has occurred (capture1 still null)
      if (!capture1) {
        setStatus("App is failing to capture: please ensure you are using the Material Storage via the Journal and check Alt1 settings.", "error");
        log("6s timeout: no pre-scroll capture occurred");
      }
    }, 6000);

    // if user captures, clear timer (the capture handler clears it)
    capture1Btn._timeoutId = timeout;
  });

  capture1Btn && capture1Btn.addEventListener("click", async () => {
    if (!isAlt1Present()) return;
    setStatus("Capturing Screen 1 (pre-scroll)...", "info");
    try {
      const raw = await captureHoldFullRsSafe();
      if (!raw) {
        setStatus("Capture 1 returned no image (check Alt1 permissions).", "error");
        return;
      }
      const dataUrl = await toDataUrlFromAlt1Image(raw);
      capture1 = { raw, dataUrl };
      setStatus("Screen 1 captured. Now scroll in-game (Dragonkin should remain visible), then click 'Capture Screen 2'.", "success");
      capture1Btn.disabled = true;
      capture2Btn.disabled = false;

      // clear timer if set
      if (capture1Btn._timeoutId) clearTimeout(capture1Btn._timeoutId);
    } catch (err) {
      console.error("[MSC] capture1 handler error:", err);
      setStatus("Failed to capture Screen 1. See console for details.", "error");
    }
  });

  capture2Btn && capture2Btn.addEventListener("click", async () => {
    if (!isAlt1Present()) return;
    setStatus("Capturing Screen 2 (post-scroll)...", "info");
    try {
      const raw = await captureHoldFullRsSafe();
      if (!raw) {
        setStatus("Capture 2 returned no image (check Alt1 permissions).", "error");
        return;
      }
      const dataUrl = await toDataUrlFromAlt1Image(raw);
      capture2 = { raw, dataUrl };
      setStatus("Screen 2 captured. Both screens recorded. Proceeding to merge/prepare export (OCR step not yet implemented).", "success");

      // For now we just log the images and leave them in memory for later processing.
      console.log("[MSC] capture1", capture1);
      console.log("[MSC] capture2", capture2);

      // disable buttons to prevent extra captures until user restarts
      capture2Btn.disabled = true;
    } catch (err) {
      console.error("[MSC] capture2 handler error:", err);
      setStatus("Failed to capture Screen 2. See console for details.", "error");
    }
  });

  // fallback safety if DOM elements not found
  if (!startBtn || !capture1Btn || !capture2Btn || !statusArea) {
    console.error("[MSC] Missing expected DOM elements. Ensure index.html contains elements with IDs: startCapture, capture1, capture2, statusArea");
    setStatus("Feature not initialized: missing UI elements (see console).", "error");
  }
});
