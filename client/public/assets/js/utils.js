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

// Remove auth token from localStorage
function removeToken() {
  localStorage.removeItem("token");
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
