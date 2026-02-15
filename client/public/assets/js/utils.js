// ============================================
// UTILITY FUNCTIONS
// Shared utilities for the application
// ============================================

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Set auth token in localStorage
function setToken(token) {
  localStorage.setItem("token", token);
}

// Remove auth token and user from localStorage
function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getToken();
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date and time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Show loading spinner
function showLoading(element) {
  if (element) {
    element.innerHTML = '<div class="loading-spinner">Loading...</div>';
  }
}

// Show error message
function showErrorMessage(message, element) {
  if (element) {
    element.innerHTML = `<div class="error-message">${message}</div>`;
  }
}

// Show success message
function showSuccessMessage(message, element) {
  if (element) {
    element.innerHTML = `<div class="success-message">${message}</div>`;
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isStrongPassword(password) {
  // At least 6 characters
  return password.length >= 6;
}

// Get login redirect URL (preserves admin/student context)
function getLoginRedirectUrl() {
  const path = window.location.pathname || "";
  if (path.includes("admin-dashboard")) return "/pages/login.html?role=admin";
  if (path.includes("student-dashboard"))
    return "/pages/login.html?role=student";
  return "/pages/login.html";
}

// Authenticated fetch - adds Bearer token, handles 401 by redirecting to login
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : "",
  };
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError) {
    // Network error - don't clear token, let caller handle
    throw networkError;
  }
  if (res.status === 401) {
    removeToken();
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = getLoginRedirectUrl();
    }
  }
  return res;
}
