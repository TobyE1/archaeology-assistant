// ✅ Ensure this file runs only after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startCapture");
  const capture1Btn = document.getElementById("capture1");
  const capture2Btn = document.getElementById("capture2");
  const statusArea = document.getElementById("statusArea");

  // Store images in memory for now
  let capture1 = null;
  let capture2 = null;

  /**
   * Helper to show messages in the status area
   */
  function setStatus(message, type = "info") {
    statusArea.textContent = message;
    statusArea.className = `status-area ${type}`;
  }

  /**
   * Check if Alt1 is available
   */
  function isAlt1Active() {
    if (typeof alt1 === "undefined" || !alt1) {
      setStatus("⚠️ Alt1 not detected. Please run this inside the Alt1 Toolkit.", "error");
      return false;
    }
    return true;
  }

  /**
   * Start Capture Flow
   */
  startBtn.addEventListener("click", () => {
    if (!isAlt1Active()) return;

    setStatus("Step 1: Open your Material Storage via Journal (no scroll). Click 'Capture Screen 1' when ready.", "info");

    capture1Btn.disabled = false;
    capture2Btn.disabled = true;
  });

  /**
   * Capture Screen 1 (Pre-scroll)
   */
  capture1Btn.addEventListener("click", () => {
    if (!isAlt1Active()) return;

    try {
      setStatus("Capturing pre-scroll image...", "info");
      capture1 = a1lib.captureHoldFullRs();
      setStatus("✅ Screen 1 captured! Now scroll down until Zarosian Materials are visible and click 'Capture Screen 2'.", "success");

      capture1Btn.disabled = true;
      capture2Btn.disabled = false;
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to capture Screen 1. Please try again.", "error");
    }
  });

  /**
   * Capture Screen 2 (Post-scroll)
   */
  capture2Btn.addEventListener("click", () => {
    if (!isAlt1Active()) return;

    try {
      setStatus("Capturing post-scroll image...", "info");
      capture2 = a1lib.captureHoldFullRs();

      // Placeholder for merge/export logic (next story)
      setStatus("✅ Capture complete! Both screens recorded. Export options coming soon.", "success");

      capture2Btn.disabled = true;
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to capture Screen 2. Please try again.", "error");
    }
  });
});
