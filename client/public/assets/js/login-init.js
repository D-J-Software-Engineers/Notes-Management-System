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

// Update login page title based on role (student vs admin)
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role");
  const titleEl = document.getElementById("loginTitle");
  const subtitleEl = document.getElementById("loginSubtitle");
  if (role === "admin" && titleEl && subtitleEl) {
    titleEl.textContent = "🔐 Nsoma Digilib - Admin";
    subtitleEl.textContent = "Access your admin account";
    const registerLink = document.getElementById("registerLink");
    if (registerLink) registerLink.style.display = "none";
  } else if (role === "student" && titleEl && subtitleEl) {
    titleEl.textContent = "📚 Nsoma Digilib - Student";
    subtitleEl.textContent = "Access your student account";
  }

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
