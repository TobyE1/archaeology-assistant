// =============================================================
// Material Storage Capture | Debug-enabled version
// =============================================================
alert("materialCapture.js loaded!");
console.log("[MSC] script loaded");

// Wait until DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  console.log("[MSC] DOM loaded and script running");

  const startBtn = document.getElementById("startCapture");
  const capture1Btn = document.getElementById("capture1");
  const capture2Btn = document.getElementById("capture2");
  const statusArea = document.getElementById("statusArea");

  console.log("[MSC] Elements found:", {
    startBtn: !!startBtn,
    capture1Btn: !!capture1Btn,
    capture2Btn: !!capture2Btn,
    statusArea: !!statusArea,
  });

  let capture1 = null;
  let capture2 = null;

  function setStatus(message, type = "info") {
    console.log(`[MSC] STATUS (${type}): ${message}`);
    if (!statusArea) return;
    statusArea.textContent = message;
    statusArea.className = `status-area ${type}`;
  }

  function isAlt1Active() {
    const active = typeof alt1 !== "undefined" && alt1;
    console.log(`[MSC] Alt1 active check: ${active}`);
    if (!active) {
      setStatus("⚠️ Alt1 not detected. Please run this inside the Alt1 Toolkit.", "error");
      return false;
    }
    return true;
  }

  // ========== START CAPTURE FLOW ==========
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      console.log("[MSC] Start Capture button clicked");
      if (!isAlt1Active()) return;

      setStatus("Step 1: Open your Material Storage via Journal (no scroll). Click 'Capture Screen 1' when ready.", "info");

      capture1Btn.disabled = false;
      capture2Btn.disabled = true;
    });
  } else {
    console.warn("[MSC] ⚠️ startCapture button not found in DOM");
  }

  // ========== CAPTURE SCREEN 1 ==========
  if (capture1Btn) {
    capture1Btn.addEventListener("click", () => {
      console.log("[MSC] Capture Screen 1 clicked");
      if (!isAlt1Active()) return;

      try {
        setStatus("Capturing pre-scroll image...", "info");
        console.log("[MSC] Attempting Alt1 captureHoldFullRs() for screen 1");
        capture1 = a1lib.captureHoldFullRs();

        console.log("[MSC] ✅ Screen 1 captured", capture1 ? "OK" : "null");
        setStatus("✅ Screen 1 captured! Now scroll down until Zarosian Materials are visible and click 'Capture Screen 2'.", "success");

        capture1Btn.disabled = true;
        capture2Btn.disabled = false;
      } catch (err) {
        console.error("[MSC] ❌ Error capturing Screen 1:", err);
        setStatus("❌ Failed to capture Screen 1. Please try again.", "error");
      }
    });
  }

  // ========== CAPTURE SCREEN 2 ==========
  if (capture2Btn) {
    capture2Btn.addEventListener("click", () => {
      console.log("[MSC] Capture Screen 2 clicked");
      if (!isAlt1Active()) return;

      try {
        setStatus("Capturing post-scroll image...", "info");
        console.log("[MSC] Attempting Alt1 captureHoldFullRs() for screen 2");
        capture2 = a1lib.captureHoldFullRs();

        console.log("[MSC] ✅ Screen 2 captured", capture2 ? "OK" : "null");
        setStatus("✅ Capture complete! Both screens recorded. Export options coming soon.", "success");

        capture2Btn.disabled = true;
      } catch (err) {
        console.error("[MSC] ❌ Error capturing Screen 2:", err);
        setStatus("❌ Failed to capture Screen 2. Please try again.", "error");
      }
    });
  }
});
