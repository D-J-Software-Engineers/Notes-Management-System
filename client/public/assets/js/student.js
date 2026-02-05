// ============================================
// STUDENT DASHBOARD JAVASCRIPT
// Handles all student operations - JS-driven UI
// ============================================

const API_BASE = "/api";
let currentStudent = null;
let allNotes = [];
let allSubjects = [];

// Initialize student dashboard
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});

// Check authentication
async function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Not authenticated");
    }

    const data = await response.json();

    // Strict role check: Only students can access student dashboard
    if (data.data.role !== "student") {
      alert(
        "Access denied. This is a student-only area. Admin accounts cannot access this dashboard.",
      );
      removeToken();
      window.location.href = "/pages/login.html";
      return;
    }

    currentStudent = data.data;
    renderApp();
  } catch (error) {
    console.error("Auth check failed:", error);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
  }
}

// Render entire app (JS-driven)
function renderApp() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <!-- Navigation -->
        <nav class="student-nav">
            <div class="nav-container">
                <h1 class="nav-logo">📚 Student Dashboard</h1>
                <div class="nav-user">
                    <span id="studentName">${currentStudent.name}</span>
                    <button class="btn-logout" id="logoutBtn">Logout</button>
                </div>
            </div>
        </nav>

        <!-- Main Container -->
        <div class="student-container">
            <!-- Sidebar -->
            <aside class="student-sidebar">
                <ul class="sidebar-menu">
                    <li><a href="#" class="sidebar-link active" data-tab="dashboard">📊 Dashboard</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="notes">📝 Notes</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="subjects">📖 Subjects</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="profile">👤 Profile</a></li>
                </ul>
            </aside>

            <!-- Main Content -->
            <main class="student-main" id="mainContent">
                <!-- Content will be rendered by JS -->
            </main>
        </div>
    `;

  setupEventListeners();
  switchTab("dashboard");
}

// Setup all event listeners
function setupEventListeners() {
  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Tab navigation
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = link.getAttribute("data-tab");
      switchTab(tabName);
    });
  });
}

// Switch tabs
function switchTab(tabName) {
  // Update active tab
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.classList.remove("active");
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  // Render tab content
  const mainContent = document.getElementById("mainContent");

  if (tabName === "dashboard") {
    mainContent.innerHTML = renderDashboard();
    loadDashboard();
  } else if (tabName === "notes") {
    mainContent.innerHTML = renderNotesTab();
    setupNotesListeners();
    loadNotes();
  } else if (tabName === "subjects") {
    mainContent.innerHTML = renderSubjectsTab();
    setupSubjectsListeners();
    loadSubjects();
  } else if (tabName === "profile") {
    mainContent.innerHTML = renderProfileTab();
    setupProfileListeners();
  }
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
  return `
        <div id="dashboard" class="tab-content active">
            <h2>Welcome, ${currentStudent.name}!</h2>
            <div class="student-info-card">
                <h3>Your Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Class:</strong> ${currentStudent.class ? currentStudent.class.toUpperCase() : "Not set"}
                    </div>
                    <div class="info-item">
                        <strong>Level:</strong> ${currentStudent.level ? currentStudent.level.toUpperCase() : "Not set"}
                    </div>
                    ${
                      currentStudent.stream
                        ? `
                        <div class="info-item">
                            <strong>Stream:</strong> ${currentStudent.stream}
                        </div>
                    `
                        : ""
                    }
                    ${
                      currentStudent.combination
                        ? `
                        <div class="info-item">
                            <strong>Combination:</strong> ${currentStudent.combination}
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Available Notes</h3>
                    <p class="stat-number" id="availableNotes">0</p>
                </div>
                <div class="stat-card">
                    <h3>Available Subjects</h3>
                    <p class="stat-number" id="availableSubjects">0</p>
                </div>
            </div>
        </div>
    `;
}

async function loadDashboard() {
  try {
    // Load notes and subjects filtered by student's level and class
    const level = currentStudent.level;
    const classLevel = currentStudent.class;

    let notesUrl = `${API_BASE}/notes`;
    let subjectsUrl = `${API_BASE}/subjects`;

    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);

    const notesQuery = params.toString() ? `?${params.toString()}` : "";
    const subjectsQuery = params.toString() ? `?${params.toString()}` : "";

    const [notesRes, subjectsRes] = await Promise.all([
      fetch(`${notesUrl}${notesQuery}`, { headers: getAuthHeaders() }),
      fetch(`${subjectsUrl}${subjectsQuery}`, { headers: getAuthHeaders() }),
    ]);

    const notesData = await notesRes.json();
    const subjectsData = await subjectsRes.json();

    const notes = notesData.data || [];
    const subjects = subjectsData.data || [];

    document.getElementById("availableNotes").textContent = notes.length;
    document.getElementById("availableSubjects").textContent = subjects.length;
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    showError("Failed to load dashboard data");
  }
}

// ============================================
// NOTES MANAGEMENT
// ============================================

function renderNotesTab() {
  return `
        <div id="notes" class="tab-content">
            <div class="section-header">
                <h2>Available Notes</h2>
                <div class="filters">
                    <input type="text" id="noteSearch" placeholder="Search notes...">
                    <select id="noteSubjectFilter">
                        <option value="">All Subjects</option>
                    </select>
                </div>
            </div>
            <div class="notes-grid" id="notesGrid">
                <div class="loading">Loading notes...</div>
            </div>
        </div>
    `;
}

function setupNotesListeners() {
  document
    .getElementById("noteSearch")
    .addEventListener("input", debounce(loadNotes, 300));
  document
    .getElementById("noteSubjectFilter")
    .addEventListener("change", loadNotes);

  // Event delegation for note actions
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("download-note-btn")) {
      downloadNote(e.target.getAttribute("data-note-id"));
    } else if (e.target.classList.contains("view-note-btn")) {
      viewNote(e.target.getAttribute("data-note-id"));
    }
  });
}

async function loadNotes() {
  try {
    const level = currentStudent.level;
    const classLevel = currentStudent.class;
    const search = document.getElementById("noteSearch").value;
    const subjectFilter = document.getElementById("noteSubjectFilter").value;

    let url = `${API_BASE}/notes`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (search) params.append("search", search);
    if (subjectFilter) params.append("subject", subjectFilter);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load notes");

    const data = await response.json();
    allNotes = data.data || [];
    displayNotes(allNotes);
    updateSubjectFilter(allNotes);
  } catch (error) {
    console.error("Failed to load notes:", error);
    showError("Failed to load notes");
  }
}

function updateSubjectFilter(notes) {
  const subjectFilter = document.getElementById("noteSubjectFilter");
  const subjects = [...new Set(notes.map((n) => n.subject))].sort();

  // Keep "All Subjects" option and add unique subjects
  subjectFilter.innerHTML = '<option value="">All Subjects</option>';
  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectFilter.appendChild(option);
  });
}

function displayNotes(notes) {
  const grid = document.getElementById("notesGrid");

  if (notes.length === 0) {
    grid.innerHTML = '<div class="no-data">No notes found</div>';
    return;
  }

  grid.innerHTML = notes
    .map(
      (note) => `
        <div class="note-card">
            <div class="note-header">
                <h3>${note.title}</h3>
                <span class="note-badge">${note.subject}</span>
            </div>
            ${note.description ? `<p class="note-description">${note.description}</p>` : ""}
            <div class="note-meta">
                <span>📅 ${new Date(note.createdAt).toLocaleDateString()}</span>
                <span>👁️ ${note.views || 0} views</span>
                <span>⬇️ ${note.downloads || 0} downloads</span>
            </div>
            <div class="note-actions">
                <button class="btn-sm btn-primary view-note-btn" data-note-id="${note._id}">View</button>
                <button class="btn-sm btn-success download-note-btn" data-note-id="${note._id}">Download</button>
            </div>
        </div>
    `,
    )
    .join("");
}

async function downloadNote(id) {
  try {
    const response = await fetch(`${API_BASE}/notes/${id}/download`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to download note");

    // Get filename from response headers
    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : "note.pdf";

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccess("Note downloaded successfully");
    loadNotes(); // Refresh to update download count
  } catch (error) {
    console.error("Failed to download note:", error);
    showError("Failed to download note");
  }
}

async function viewNote(id) {
  const note = allNotes.find((n) => n._id === id);
  if (!note) return;

  showModal(
    "Note Details",
    `
        <div class="note-details">
            <h3>${note.title}</h3>
            <p><strong>Subject:</strong> ${note.subject}</p>
            <p><strong>Level:</strong> ${note.level}</p>
            <p><strong>Class:</strong> ${note.class.toUpperCase()}</p>
            ${note.combination ? `<p><strong>Combination:</strong> ${note.combination}</p>` : ""}
            ${note.description ? `<p><strong>Description:</strong> ${note.description}</p>` : ""}
            <p><strong>File:</strong> ${note.originalFileName}</p>
            <p><strong>Size:</strong> ${formatFileSize(note.fileSize)}</p>
            <p><strong>Uploaded:</strong> ${new Date(note.createdAt).toLocaleDateString()}</p>
            <p><strong>Views:</strong> ${note.views || 0}</p>
            <p><strong>Downloads:</strong> ${note.downloads || 0}</p>
            <div class="form-actions">
                <button class="btn-primary" id="downloadFromModalBtn" data-note-id="${note._id}">Download Note</button>
            </div>
        </div>
    `,
    () => {
      document
        .getElementById("downloadFromModalBtn")
        .addEventListener("click", (e) => {
          downloadNote(e.target.getAttribute("data-note-id"));
          closeModal();
        });
    },
  );
}

// ============================================
// SUBJECTS MANAGEMENT
// ============================================

function renderSubjectsTab() {
  return `
        <div id="subjects" class="tab-content">
            <div class="section-header">
                <h2>Available Subjects</h2>
            </div>
            <div class="subjects-container">
                <div id="subjectsList" class="loading">Loading subjects...</div>
            </div>
        </div>
    `;
}

function setupSubjectsListeners() {
  // No specific listeners needed for subjects view
}

async function loadSubjects() {
  try {
    const level = currentStudent.level;
    const classLevel = currentStudent.class;

    let url = `${API_BASE}/subjects`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load subjects");

    const data = await response.json();
    allSubjects = data.data || [];
    displaySubjects(allSubjects);
  } catch (error) {
    console.error("Failed to load subjects:", error);
    showError("Failed to load subjects");
  }
}

function displaySubjects(subjects) {
  const container = document.getElementById("subjectsList");

  if (subjects.length === 0) {
    container.innerHTML = '<div class="no-data">No subjects found</div>';
    return;
  }

  // Group by compulsory/optional
  const compulsory = subjects.filter((s) => s.isCompulsory);
  const optional = subjects.filter((s) => !s.isCompulsory);

  let html = "";

  if (compulsory.length > 0) {
    html += `
            <div class="subject-group">
                <h3>Compulsory Subjects</h3>
                <div class="subjects-grid">
                    ${compulsory
                      .map(
                        (subject) => `
                        <div class="subject-card">
                            <h4>${subject.name}</h4>
                            ${subject.code ? `<span class="subject-code">${subject.code}</span>` : ""}
                            ${subject.stream ? `<span class="subject-stream">${subject.stream}</span>` : ""}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  if (optional.length > 0) {
    html += `
            <div class="subject-group">
                <h3>Optional Subjects</h3>
                <div class="subjects-grid">
                    ${optional
                      .map(
                        (subject) => `
                        <div class="subject-card">
                            <h4>${subject.name}</h4>
                            ${subject.code ? `<span class="subject-code">${subject.code}</span>` : ""}
                            ${subject.stream ? `<span class="subject-stream">${subject.stream}</span>` : ""}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  container.innerHTML = html;
}

// ============================================
// PROFILE
// ============================================

function renderProfileTab() {
  return `
        <div id="profile" class="tab-content">
            <h2>My Profile</h2>
            <div class="profile-card">
                <div class="profile-info">
                    <h3>${currentStudent.name}</h3>
                    <p><strong>Email:</strong> ${currentStudent.email}</p>
                    <p><strong>Class:</strong> ${currentStudent.class ? currentStudent.class.toUpperCase() : "Not set"}</p>
                    <p><strong>Level:</strong> ${currentStudent.level ? currentStudent.level.toUpperCase() : "Not set"}</p>
                    ${currentStudent.stream ? `<p><strong>Stream:</strong> ${currentStudent.stream}</p>` : ""}
                    ${currentStudent.combination ? `<p><strong>Combination:</strong> ${currentStudent.combination}</p>` : ""}
                    <p><strong>Status:</strong> <span class="badge ${currentStudent.isConfirmed ? "badge-success" : "badge-warning"}">${currentStudent.isConfirmed ? "Confirmed" : "Pending Approval"}</span></p>
                    <p><strong>Member since:</strong> ${new Date(currentStudent.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    `;
}

function setupProfileListeners() {
  // No specific listeners needed for profile view
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/pages/login.html";
}

function showSuccess(message) {
  alert(message);
}

function showError(message) {
  alert("Error: " + message);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

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

// Modal management
function showModal(title, content, onOpen) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "dynamicModal";
  modal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closeModalBtn">&times;</span>
            <h2>${title}</h2>
            ${content}
        </div>
    `;
  document.body.appendChild(modal);
  modal.style.display = "block";

  document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeModal);

  if (onOpen) onOpen();

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById("dynamicModal");
  if (modal) {
    modal.remove();
  }
}
