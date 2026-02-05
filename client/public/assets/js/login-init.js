// ============================================
// LOGIN PAGE INITIALIZATION
// Handles login page specific initialization
// ============================================

// Prevent browser extension errors from breaking the page
window.addEventListener("error", function (e) {
  // Ignore extension-related errors
  if (e.message && e.message.includes("Receiving end does not exist")) {
    e.preventDefault();
    console.warn("Browser extension error (safe to ignore):", e.message);
    return false;
  }
});

// Ensure form submission works even if extensions interfere
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (form) {
    // Remove inline onsubmit handler and use addEventListener instead
    form.onsubmit = null;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Ensure our handler runs
      if (typeof handleLogin === "function") {
        handleLogin(e);
      } else {
        console.error("handleLogin function not found");
      }
    });
  }
});
