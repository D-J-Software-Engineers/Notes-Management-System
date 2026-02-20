// ============================================
// AUTHENTICATION JAVASCRIPT
// Handles login, registration, and auth state
// Handles BOTH Admin and Student logins with role-based security
// ============================================

const API_BASE = "/api";

// Token management functions
function setToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  event.stopPropagation();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");
  const submitButton = event.target.querySelector('button[type="submit"]');

  if (!emailInput || !passwordInput || !errorMessage) {
    console.error("Login form elements not found");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // TIGHTENING: Get current role from URL parameters
  // This ensures students can't login on admin page and vice-versa
  const urlParams = new URLSearchParams(window.location.search);
  const requestedRole = urlParams.get("role") || "student";

  // Clear previous errors
  errorMessage.classList.remove("show");
  errorMessage.textContent = "";

  // Validate inputs
  if (!email || !password) {
    errorMessage.textContent = "Please enter both email and password";
    errorMessage.classList.add("show");
    return;
  }

  // Disable submit button
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role: requestedRole }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      // Server-side validation error (e.g. wrong credentials, wrong role)
      throw new Error(data.message || `Login failed: ${response.statusText}`);
    }

    // Validate response structure
    if (!data.data || !data.data.token || !data.data.user) {
      throw new Error("Invalid response format from server");
    }

    // Store token and user
    setToken(data.data.token);
    if (data.data.user) {
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }

    // Role-based redirection
    const userRole = data.data.user.role;
    if (userRole === "admin") {
      window.location.href = "/pages/admin-dashboard.html";
    } else {
      window.location.href = "/pages/student-dashboard.html";
    }
  } catch (error) {
    console.error("Login error:", error);

    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }

    // Show error to user
    errorMessage.textContent =
      error.message || "Login failed. Please try again.";
    errorMessage.classList.add("show");
  }
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();

  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role")?.value || "student",
    class: document.getElementById("class")?.value,
    level: document.getElementById("level")?.value,
    stream: document.getElementById("stream")?.value,
    combination: document.getElementById("combination")?.value,
  };

  const errorMessage = document.getElementById("errorMessage");
  errorMessage.classList.remove("show");
  errorMessage.textContent = "";

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    alert("Registration successful! Your account is pending admin approval.");
    window.location.href = "/pages/login.html";
  } catch (error) {
    console.error("Registration error:", error);
    errorMessage.textContent =
      error.message || "Registration failed. Please try again.";
    errorMessage.classList.add("show");
  }
}

// Global Logout
function logout() {
  removeToken();
  window.location.href = "/pages/login.html";
}

// Helper to get user profile
async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      removeToken();
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    return null;
  }
}
