// ============================================
// ADMIN DASHBOARD JAVASCRIPT
// Handles all admin operations - JS-driven UI
// ============================================

// API_BASE is globally defined in utils.js
let currentAdmin = null;
let allStudents = [];
let allSubjects = [];
let allNotes = [];
let allQuizzes = [];
let allResources = [];
let allStreams = [];
let allSchools = []; // New global to store school list
let currentTab = "dashboard";

// Token management functions
function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Initialize admin dashboard
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

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/pages/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(`Auth failed with status: ${response.status}`);
    }

    const data = await response.json();
    currentAdmin = data.data;

    if (currentAdmin.role === "student") {
      window.location.href = "/pages/student-dashboard.html";
      return;
    }

    // If super admin, pre-load schools list as it's needed for user creation
    if (currentAdmin.role === "super_admin") {
      try {
        const schRes = await fetch(`${API_BASE}/super-admin/schools`, { headers: { Authorization: `Bearer ${token}` } });
        const schData = await schRes.json();
        allSchools = schData.data || [];
      } catch (e) { console.error("Schools pre-load failed"); }
    }

    // Strict role check: Only staff/admins can access admin dashboard
    const adminRoles = ["admin", "super_admin", "school_admin", "teacher"];
    if (!adminRoles.includes(data.data.role)) {
      window.location.href = "/pages/student-dashboard.html";
      return;
    }

    currentAdmin = data.data;
    renderApp();
  } catch (error) {
    console.error("Auth check failed:", error);
    // Don't remove token on network errors
    // Optionally show a non-intrusive error message
  }
}

// Render entire app (JS-driven)
function renderApp() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <!-- Navigation -->
        <nav class="admin-nav">
            <div class="nav-container">
                <h1 class="nav-logo">📚 Admin Dashboard</h1>
                <div class="nav-user">
                    <button class="btn-refresh" id="refreshBtn">🔄 Sync Data</button>
                    <span id="adminName">${currentAdmin.name} <strong>(${currentAdmin.school ? currentAdmin.school.name : 'Master-Admin'})</strong></span>
                    <button class="btn-logout" id="logoutBtn">Logout</button>
                </div>
            </div>
        </nav>

        <!-- Main Container -->
        <div class="admin-container">
            <!-- Sidebar -->
            <aside class="admin-sidebar">
                <ul class="sidebar-menu">
                    <li><a href="#" class="sidebar-link active" data-tab="dashboard">📊 Dashboard</a></li>
                    ${currentAdmin.role === "super_admin" ? '<li><a href="#" class="sidebar-link" data-tab="schools">🏫 Schools (Platform)</a></li>' : ""}
                    <li><a href="#" class="sidebar-link" data-tab="students">👥 Students / Staff</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="subjects">📖 Subjects</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="notes">📝 Notes</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="quizzes">❓ Activity/Quizzes</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="resources">🔗 Resources</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="streams">📁 Streams</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="discussions">🗣️ Discussions/Meetings</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="reset-requests">🔑 Reset Requests</a></li>
                    ${currentAdmin.role === "super_admin" || (!currentAdmin.schoolId) ? '<li><a href="#" class="sidebar-link" data-tab="activation">🛡️ System Activation</a></li>' : ""}
                </ul>
            </aside>

            <!-- Main Content -->
            <main class="admin-main" id="mainContent">
                <!-- Content will be rendered by JS -->
            </main>
        </div>
    `;

  setupEventListeners();
  // Restore the last active tab from sessionStorage so refreshing the page
  // does not bounce the admin back to the dashboard tab.
  const lastTab = sessionStorage.getItem("admin_active_tab") || "dashboard";
  switchTab(lastTab);
}

// Setup all event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshCurrentTab);
  }

  // Tab navigation
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = link.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Global event delegation for dynamically generated buttons
  document.addEventListener("click", (e) => {
    // Student actions
    if (e.target.classList.contains("view-student-btn")) {
      viewStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("confirm-student-btn")) {
      confirmStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("deactivate-student-btn")) {
      deactivateStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("activate-student-btn")) {
      activateStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("delete-student-btn")) {
      deleteStudent(e.target.getAttribute("data-student-id"));
    }
    // Subject actions
    else if (e.target.classList.contains("edit-subject-btn")) {
      editSubject(e.target.getAttribute("data-subject-id"));
    } else if (e.target.classList.contains("delete-subject-btn")) {
      deleteSubject(e.target.getAttribute("data-subject-id"));
    }
    // Note actions
    else if (e.target.classList.contains("edit-note-btn")) {
      editNote(e.target.getAttribute("data-note-id"));
    } else if (e.target.classList.contains("delete-note-btn")) {
      deleteNote(e.target.getAttribute("data-note-id"));
    }
    // Quiz actions
    else if (e.target.classList.contains("edit-quiz-btn")) {
      editQuiz(e.target.getAttribute("data-quiz-id"));
    } else if (e.target.classList.contains("delete-quiz-btn")) {
      deleteQuiz(e.target.getAttribute("data-quiz-id"));
    }
    // Resource actions
    else if (e.target.classList.contains("edit-resource-btn")) {
      editResource(e.target.getAttribute("data-resource-id"));
    } else if (e.target.classList.contains("delete-resource-btn")) {
      deleteResource(e.target.getAttribute("data-resource-id"));
    }
    // Stream actions
    else if (e.target.classList.contains("delete-stream-btn")) {
      deleteStream(e.target.getAttribute("data-stream-id"));
    }
    // Discussion actions
    else if (e.target.classList.contains("edit-discussion-btn")) {
      editDiscussion(e.target.getAttribute("data-discussion-id"));
    } else if (e.target.classList.contains("delete-discussion-btn")) {
      deleteDiscussion(e.target.getAttribute("data-discussion-id"));
    } else if (e.target.classList.contains("approve-discussion-btn")) {
      updateDiscussionStatus(e.target.getAttribute("data-discussion-id"), "approved");
    } else if (e.target.classList.contains("reject-discussion-btn")) {
      updateDiscussionStatus(e.target.getAttribute("data-discussion-id"), "rejected");
    }
    // Reset password actions
    else if (e.target.classList.contains("reset-password-btn")) {
      resetStudentPassword(
        e.target.getAttribute("data-student-id"),
        e.target.getAttribute("data-student-name"),
      );
    }
  });
}

// Switch tabs
function switchTab(tabName) {
  try {
    currentTab = tabName;
    // Persist so the page survives a browser refresh
    sessionStorage.setItem("admin_active_tab", tabName);
    console.log("Switching to tab:", tabName);

    // Update active tab
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.classList.remove("active");
    });
    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
    } else {
      console.error("Active link not found for tab:", tabName);
    }

    // Render tab content
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
      console.error("mainContent element not found");
      return;
    }

    let content = "";
    if (tabName === "dashboard") {
      content = renderDashboard();
      mainContent.innerHTML = content;
      loadDashboard();
    } else if (tabName === "students") {
      content = renderStudentsTab();
      mainContent.innerHTML = content;
      console.log("Students tab rendered, setting up listeners...");
      // Wait a bit for DOM to be ready
      setTimeout(() => {
        setupStudentsListeners();
        loadStudents();
      }, 10);
    } else if (tabName === "subjects") {
      content = renderSubjectsTab();
      mainContent.innerHTML = content;
      console.log("Subjects tab rendered, setting up listeners...");
      setTimeout(() => {
        setupSubjectsListeners();
        loadSubjects();
      }, 10);
    } else if (tabName === "notes") {
      content = renderNotesTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupNotesListeners();
        loadNotes();
      }, 10);
    } else if (tabName === "quizzes") {
      content = renderQuizzesTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupQuizzesListeners();
        loadQuizzes();
      }, 10);
    } else if (tabName === "resources") {
      content = renderResourcesTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupResourcesListeners();
        loadResources();
      }, 10);
    } else if (tabName === "streams") {
      content = renderStreamsTab();
      mainContent.innerHTML = content;
    } else if (tabName === "streams") {
      content = renderStreamsTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupStreamsListeners();
        loadStreams();
      }, 10);
    } else if (tabName === "discussions") {
      content = renderDiscussionsTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupDiscussionsListeners();
        loadDiscussions();
      }, 10);
    } else if (tabName === "reset-requests") {
      content = renderResetRequestsTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        loadResetRequests();
      }, 10);
    } else if (tabName === "schools" && currentAdmin.role === "super_admin") {
      content = renderSchoolsTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupSchoolsListeners();
        loadSchools();
      }, 10);
    } else if (tabName === "activation") {
      content = renderActivationTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        loadActivationStatus();
      }, 10);
    } else {
      console.error("Unknown tab:", tabName);
      mainContent.innerHTML = `<div class="error-message">Unknown tab: ${tabName}</div>`;
    }

    console.log("Tab content rendered, length:", content.length);
  } catch (error) {
    console.error("Error switching tab:", error);
    console.error("Error stack:", error.stack);
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.innerHTML = `<div class="error-message" style="padding: 2rem; color: red;">Error loading ${tabName}: ${error.message}<br><pre>${error.stack}</pre></div>`;
    }
  }
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
  const isSuper = currentAdmin.role === "super_admin";
  return `
        <div id="dashboard" class="tab-content">
            <h2>${isSuper ? "Global Platform Overview" : "School Dashboard Overview"}</h2>
            <div class="stats-grid">
                ${isSuper ? `
                <div class="stat-card">
                    <h3>Total Schools</h3>
                    <p class="stat-number" id="totalSchools">0</p>
                </div>
                ` : ""}
                <div class="stat-card">
                    <h3>Total Users</h3>
                    <p class="stat-number" id="totalStudents">0</p>
                </div>
                <div class="stat-card">
                    <h3>Pending Approvals</h3>
                    <p class="stat-number" id="pendingStudents">0</p>
                </div>
                ${!isSuper ? `
                <div class="stat-card">
                    <h3>Total Subjects</h3>
                    <p class="stat-number" id="totalSubjects">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Notes</h3>
                    <p class="stat-number" id="totalNotes">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Activities & Quizzes</h3>
                    <p class="stat-number" id="totalQuizzes">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Resources</h3>
                    <p class="stat-number" id="totalResources">0</p>
                </div>
                <div class="stat-card">
                    <h3>Class Streams</h3>
                    <p class="stat-number" id="totalStreams">0</p>
                </div>
                ` : `
                <div class="stat-card">
                    <h3>Global Notes</h3>
                    <p class="stat-number" id="totalNotes">0</p>
                </div>
                <div class="stat-card">
                    <h3>Global Quizzes</h3>
                    <p class="stat-number" id="totalQuizzes">0</p>
                </div>
                `}
            </div>
        </div>
    `;
}

async function loadDashboard() {
  try {
    if (currentAdmin.role === "super_admin") {
      const response = await fetch(`${API_BASE}/super-admin/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      const stats = data.data;

      if (document.getElementById("totalSchools"))
        document.getElementById("totalSchools").textContent = stats.schools;
      if (document.getElementById("totalStudents"))
        document.getElementById("totalStudents").textContent = stats.users;
      if (document.getElementById("totalNotes"))
        document.getElementById("totalNotes").textContent = stats.notes;
      if (document.getElementById("totalQuizzes"))
        document.getElementById("totalQuizzes").textContent = stats.quizzes;
      return;
    }

    const [
      studentsRes,
      subjectsRes,
      notesRes,
      quizzesRes,
      resourcesRes,
      streamsRes,
    ] = await Promise.all([
      fetch(`${API_BASE}/users`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/subjects`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/notes`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/quizzes`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/resources`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/streams`, { headers: getAuthHeaders() }),
    ]);

    const studentsData = await studentsRes.json();
    const subjectsData = await subjectsRes.json();
    const notesData = await notesRes.json();
    const quizzesData = await quizzesRes.json();
    const resourcesData = await resourcesRes.json();
    const streamsData = await streamsRes.json();

    allStudents = studentsData.data || [];
    allSubjects = subjectsData.data || [];
    allNotes = notesData.data || [];
    allQuizzes = quizzesData.data || [];
    allResources = resourcesData.data || [];
    allStreams = streamsData.data || [];

    const totalStudentsEl = document.getElementById("totalStudents");
    const pendingStudentsEl = document.getElementById("pendingStudents");
    const totalSubjectsEl = document.getElementById("totalSubjects");
    const totalNotesEl = document.getElementById("totalNotes");
    const totalQuizzesEl = document.getElementById("totalQuizzes");
    const totalResourcesEl = document.getElementById("totalResources");
    const totalStreamsEl = document.getElementById("totalStreams");

    // These elements exist only on the dashboard tab; guard against null when called from other tabs
    if (totalStudentsEl) {
      totalStudentsEl.textContent = allStudents.filter(
        (s) => s.role === "student",
      ).length;
    }

    if (pendingStudentsEl) {
      pendingStudentsEl.textContent = allStudents.filter(
        (s) => s.role === "student" && !s.isConfirmed,
      ).length;
    }

    if (totalSubjectsEl) {
      totalSubjectsEl.textContent = allSubjects.length;
    }

    if (totalNotesEl) {
      totalNotesEl.textContent = allNotes.length;
    }

    if (totalQuizzesEl) {
      totalQuizzesEl.textContent = allQuizzes.length;
    }

    if (totalResourcesEl) {
      totalResourcesEl.textContent = allResources.length;
    }

    if (totalStreamsEl) {
      totalStreamsEl.textContent = allStreams.length;
    }
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    showError("Failed to load dashboard data");
  }
}

// ============================================
// STUDENTS MANAGEMENT
// ============================================

function renderStudentsTab() {
  return `
        <div id="students" class="tab-content">
            <div class="section-header">
                <h2>Student & Staff Management</h2>
                <div class="header-actions">
                    <button class="btn-primary" id="addUserBtn">+ Add New User/Staff</button>
                </div>
            </div>
            <div class="filters">
                <select id="studentFilter">
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                    <option value="school_admin">School Admins Only</option>
                    <option value="pending">Pending Approval</option>
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Class/Section</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        <tr><td colspan="6" class="loading">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddUserModal(preSelectedSchoolId = null) {
  const isSuper = currentAdmin.role === "super_admin";
  const content = `
        <form id="userForm">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="userName" required>
            </div>
            <div class="form-group">
                <label>Email Address *</label>
                <input type="email" id="userEmail" required>
            </div>
            <div class="form-group">
                <label>Initial Password *</label>
                <input type="password" id="userPassword" value="123456" required>
            </div>
            
            ${isSuper ? `
            <div class="form-group">
                <label>Assign to School *</label>
                <select id="userSchool" required>
                    <option value="">-- Select School --</option>
                    <option value="system">Master / System Admin (No School)</option>
                    ${allSchools.map(sch => `<option value="${sch.id}" ${preSelectedSchoolId === sch.id ? 'selected' : ''}>${sch.name}</option>`).join('')}
                </select>
            </div>
            ` : ''}

            <div class="form-group">
                <label>Role *</label>
                <select id="userRole" required>
                    <option value="student">Student</option>
                    <option value="teacher" ${preSelectedSchoolId ? '' : ''}>Teacher</option>
                    ${isSuper ? '<option value="school_admin" ' + (preSelectedSchoolId ? 'selected' : '') + '>School Admin</option>' : ""}
                </select>
            </div>
            <div id="studentFields">
                <div class="form-group">
                    <label>Level</label>
                    <select id="userLevel">
                        <option value="">N/A</option>
                        <option value="o-level">O-Level</option>
                        <option value="a-level">A-Level</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Class</label>
                    <select id="userClass">
                        <option value="">Select Level First</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Create Account</button>
            </div>
        </form>
    `;

  showModal("Add New User/Staff", content, () => {
    // Initial display toggle
    const roleSelect = document.getElementById("userRole");
    const studentFields = document.getElementById("studentFields");
    if (roleSelect && studentFields) {
      studentFields.style.display = roleSelect.value === "student" ? "block" : "none";
      roleSelect.addEventListener("change", () => {
        studentFields.style.display = roleSelect.value === "student" ? "block" : "none";
      });
    }

    const levelSelect = document.getElementById("userLevel");
    if (levelSelect) {
      levelSelect.addEventListener("change", () => updateClassSelect("userLevel", "userClass"));
    }

    document.getElementById("userForm").addEventListener("submit", saveUser);
  });
}

async function saveUser(e) {
  e.preventDefault();
  const schoolVal = document.getElementById("userSchool")?.value;
  const data = {
    name: document.getElementById("userName").value,
    email: document.getElementById("userEmail").value,
    password: document.getElementById("userPassword").value,
    role: document.getElementById("userRole").value,
    schoolId: schoolVal === "system" ? null : schoolVal,
    level: document.getElementById("userLevel")?.value || null,
    class: document.getElementById("userClass")?.value || null,
    isConfirmed: true, // Manually added users are pre-confirmed
  };

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create user");
    }

    showSuccess("User account created successfully");
    closeModal();
    loadStudents();
    loadDashboard();
  } catch (err) {
    showError(err.message);
  }
}

function setupStudentsListeners() {
  const studentFilter = document.getElementById("studentFilter");
  if (studentFilter) {
    studentFilter.addEventListener("change", filterStudents);
  }

  const addUserBtn = document.getElementById("addUserBtn");
  if (addUserBtn) {
    addUserBtn.addEventListener("click", showAddUserModal);
  }
}

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load students");

    const data = await response.json();
    allStudents = data.data || [];
    displayStudents(allStudents);
  } catch (error) {
    console.error("Failed to load students:", error);
    showError("Failed to load students");
  }
}

function filterStudents() {
  const filter = document.getElementById("studentFilter").value;
  let filtered = allStudents;

  if (filter === "student") {
    filtered = allStudents.filter((s) => s.role === "student");
  } else if (filter === "teacher") {
    filtered = allStudents.filter((s) => s.role === "teacher");
  } else if (filter === "school_admin") {
    filtered = allStudents.filter((s) => s.role === "school_admin");
  } else if (filter === "pending") {
    filtered = allStudents.filter((s) => !s.isConfirmed);
  }

  displayStudents(filtered);
}

function displayStudents(students) {
  const tbody = document.getElementById("studentsTableBody");

  if (students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="no-data">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = students
    .map(
      (student) => {
        const studentSchool = allSchools.find(sch => sch.id === student.schoolId);
        return `
        <tr>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td><span class="badge badge-info">${student.role.toUpperCase()}</span></td>
            <td>
                ${student.class || "-"} ${student.level ? `(${student.level})` : ""}
                <br><small style="color: #666; font-weight: 500;">🏫 ${studentSchool ? studentSchool.name : 'Master-Admin'}</small>
            </td>
            <td>
                <span class="badge ${student.isConfirmed ? "badge-success" : "badge-warning"}">
                    ${student.isConfirmed ? "Confirmed" : "Pending"}
                </span>
                ${!student.isActive ? '<span class="badge badge-danger">Inactive</span>' : ""}
            </td>
            <td>
                <button class="btn-sm btn-primary view-student-btn" data-student-id="${student.id}">View</button>
                ${!student.isConfirmed ? `<button class="btn-sm btn-success confirm-student-btn" data-student-id="${student.id}">Confirm</button>` : ""}
                ${student.isActive ? `<button class="btn-sm btn-danger deactivate-student-btn" data-student-id="${student.id}">Deactivate</button>` : `<button class="btn-sm btn-success activate-student-btn" data-student-id="${student.id}">Activate</button>`}
                <button class="btn-sm btn-danger delete-student-btn" data-student-id="${student.id}">Delete</button>
            </td>
        </tr>
    `})
    .join("");
}

async function confirmStudent(id) {
  if (!confirm("Confirm this student's account?")) return;

  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isConfirmed: true }),
    });

    if (!response.ok) throw new Error("Failed to confirm student");

    showSuccess("Student confirmed successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to confirm student:", error);
    showError("Failed to confirm student");
  }
}

async function deactivateStudent(id) {
  if (!confirm("Deactivate this student's account?")) return;

  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: false }),
    });

    if (!response.ok) throw new Error("Failed to deactivate student");

    showSuccess("Student deactivated successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to deactivate student:", error);
    showError("Failed to deactivate student");
  }
}

async function activateStudent(id) {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: true }),
    });

    if (!response.ok) throw new Error("Failed to activate student");

    showSuccess("Student activated successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to activate student:", error);
    showError("Failed to activate student");
  }
}

async function deleteStudent(id) {
  if (
    !confirm(
      "Are you sure you want to delete this student? This action cannot be undone.",
    )
  )
    return;

  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete student");

    showSuccess("Student deleted successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to delete student:", error);
    showError("Failed to delete student");
  }
}

async function viewStudent(id) {
  const student = allStudents.find((s) => s.id === id);
  if (!student) return;

  showModal(
    "Student Details",
    `
        <div class="student-details">
            <p><strong>Name:</strong> ${student.name}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Role:</strong> ${student.role}</p>
            <p><strong>Class:</strong> ${student.class || "-"}</p>
            <p><strong>Level:</strong> ${student.level || "-"}</p>
            ${student.stream ? `<p><strong>Stream:</strong> ${student.stream}</p>` : ""}
            ${student.combination ? `<p><strong>Combination:</strong> ${student.combination}</p>` : ""}
            <p><strong>Status:</strong> ${student.isConfirmed ? "Confirmed" : "Pending Approval"}</p>
            <p><strong>School:</strong> ${student.school ? student.school.name : (allSchools.find(s => s.id === student.schoolId)?.name || "Master-Admin")}</p>
            <p><strong>Active:</strong> ${student.isActive ? "Yes" : "No"}</p>
            <p><strong>Registered:</strong> ${new Date(student.createdAt).toLocaleDateString()}</p>
        </div>
    `,
  );
}

// ============================================
// SUBJECTS MANAGEMENT
// ============================================

function renderSubjectsTab() {
  return `
        <div id="subjects" class="tab-content">
            <div class="section-header">
                <h2>Subject Management</h2>
                <button class="btn-primary" id="addSubjectBtn">+ Add Subject</button>
            </div>
            <div class="filters">
                <select id="subjectLevelFilter">
                    <option value="">All Levels</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
                <select id="subjectClassFilter" style="display: none;">
                    <!-- Hidden but kept for any legacy code expecting it -->
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Level</th>
                            <th>Type</th>
                            <th>Stream</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="subjectsTableBody">
                        <tr><td colspan="6" class="loading">Loading subjects...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupSubjectsListeners() {
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const subjectLevelFilter = document.getElementById("subjectLevelFilter");

  if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", showAddSubjectModal);
  }
  if (subjectLevelFilter) {
    subjectLevelFilter.addEventListener("change", loadSubjects);
  }

  // Event delegation is handled at document level
}

async function loadSubjects() {
  try {
    const level = document.getElementById("subjectLevelFilter").value;

    let url = `${API_BASE}/subjects`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load subjects");

    const data = await response.json();

    // Group subjects by name and level (since they are duplicated across classes)
    const uniqueSubjectsMap = new Map();
    data.data.forEach(sub => {
      const key = sub.name + "-" + sub.level;
      if (!uniqueSubjectsMap.has(key)) {
        uniqueSubjectsMap.set(key, sub);
      }
    });

    allSubjects = Array.from(uniqueSubjectsMap.values());
    displaySubjects(allSubjects);
  } catch (error) {
    console.error("Failed to load subjects:", error);
    showError("Failed to load subjects");
  }
}

function displaySubjects(subjects) {
  const tbody = document.getElementById("subjectsTableBody");

  if (subjects.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="no-data">No subjects found</td></tr>';
    return;
  }

  tbody.innerHTML = subjects
    .map(
      (subject) => {
        let typeLabel = "Optional";
        if (subject.isSubsidiary) typeLabel = "Subsidiary";
        else if (subject.isCompulsory) typeLabel = subject.level === "a-level" ? "Core (Main)" : "Compulsory";

        return `
        <tr>
            <td>${subject.name}</td>
            <td>${subject.code || "-"}</td>
            <td>${subject.level === "o-level" ? "O-Level" : "A-Level"}</td>
            <td>${typeLabel}</td>
            <td>${subject.stream ? subject.stream.charAt(0).toUpperCase() + subject.stream.slice(1) : "-"}</td>
            <td>
                <button class="btn-sm btn-primary edit-subject-btn" data-subject-id="${subject.id}">Edit</button>
                <button class="btn-sm btn-danger delete-subject-btn" data-subject-id="${subject.id}">Delete</button>
            </td>
        </tr>
    `})
    .join("");
}

function showAddSubjectModal() {
  showSubjectModal("Add Subject", null);
}

function editSubject(id) {
  const subject = allSubjects.find((s) => s.id === id);
  if (!subject) return;
  showSubjectModal("Edit Subject", subject);
}

function showSubjectModal(title, subject) {
  const modalContent = `
        <form id="subjectForm">
            <input type="hidden" id="subjectId" value="${subject ? subject.id : ""}">
            <div class="form-group">
                <label>Subject Name *</label>
                <input type="text" id="subjectName" value="${subject ? subject.name : ""}" required>
            </div>
            <div class="form-group">
                <label>Subject Code</label>
                <input type="text" id="subjectCode" value="${subject ? subject.code || "" : ""}">
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="subjectLevel" required>
                    <option value="">Select Level</option>
                    <option value="o-level" ${subject && subject.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${subject && subject.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            
            <div id="oLevelOptions" style="${subject && subject.level === "o-level" ? "display:block" : "display:none"}">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="isOLevelOptional" ${subject && !subject.isCompulsory ? "checked" : ""}> Optional Subject (Uncheck for Compulsory)
                    </label>
                </div>
            </div>

            <div id="aLevelOptions" style="${subject && subject.level === "a-level" ? "display:block" : "display:none"}">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="isALevelSubsidiary" ${subject && subject.isSubsidiary ? "checked" : ""}> Subsidiary Subject (Uncheck for Core)
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label>Stream</label>
                <select id="subjectStream">
                    <option value="">None</option>
                    <option value="arts" ${subject && subject.stream === "arts" ? "selected" : ""}>Arts</option>
                    <option value="science" ${subject && subject.stream === "science" ? "selected" : ""}>Science</option>
                    <option value="both" ${subject && subject.stream === "both" ? "selected" : ""}>Both</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancelSubjectBtn">Cancel</button>
                <button type="submit" class="btn-primary">Save Subject</button>
            </div>
        </form>
    `;

  showModal(title, modalContent, () => {
    const subjectLevel = document.getElementById("subjectLevel");
    if (subjectLevel) {
      subjectLevel.addEventListener("change", updateSubjectTypeOptions);
    }

    const form = document.getElementById("subjectForm");
    form.addEventListener("submit", saveSubject);

    document
      .getElementById("cancelSubjectBtn")
      .addEventListener("click", closeModal);
  });
}

function updateSubjectTypeOptions() {
  const level = document.getElementById("subjectLevel").value;
  const oLevelGroup = document.getElementById("oLevelOptions");
  const aLevelGroup = document.getElementById("aLevelOptions");

  if (level === "o-level") {
    oLevelGroup.style.display = "block";
    aLevelGroup.style.display = "none";
  } else if (level === "a-level") {
    oLevelGroup.style.display = "none";
    aLevelGroup.style.display = "block";
  } else {
    oLevelGroup.style.display = "none";
    aLevelGroup.style.display = "none";
  }
}

async function saveSubject(event) {
  event.preventDefault();

  const id = document.getElementById("subjectId").value;
  const name = document.getElementById("subjectName").value;
  const level = document.getElementById("subjectLevel").value;

  if (!name || !level) {
    showError("Please fill in all required fields");
    return;
  }

  let isCompulsory = true;
  let isSubsidiary = false;

  if (level === "o-level") {
    isCompulsory = !document.getElementById("isOLevelOptional").checked;
  } else if (level === "a-level") {
    isSubsidiary = document.getElementById("isALevelSubsidiary").checked;
    isCompulsory = !isSubsidiary; // If it's a subsidiary it's not core(compulsory), and vice versa
  }

  const payload = {
    name,
    code: document.getElementById("subjectCode").value,
    level,
    isCompulsory,
    isSubsidiary,
    stream: document.getElementById("subjectStream").value || null,
  };

  try {
    const url = id ? `${API_BASE}/subjects/${id}` : `${API_BASE}/subjects`;
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save subject");
    }

    showSuccess(
      id ? "Subject updated successfully" : "Subject added successfully",
    );
    closeModal();
    loadSubjects();
    loadDashboard();
  } catch (error) {
    console.error("Failed to save subject:", error);
    showError(error.message || "Failed to save subject");
  }
}

async function deleteSubject(id) {
  if (!confirm("Are you sure you want to delete this subject?")) return;

  try {
    const response = await fetch(`${API_BASE}/subjects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete subject");

    showSuccess("Subject deleted successfully");
    loadSubjects();
    loadDashboard();
  } catch (error) {
    console.error("Failed to delete subject:", error);
    showError("Failed to delete subject");
  }
}

// ============================================
// NOTES MANAGEMENT
// ============================================

function renderNotesTab() {
  return `
        <div id="notes" class="tab-content">
            <div class="section-header">
                <h2>Notes Management</h2>
                <button class="btn-primary" id="addNoteBtn">+ Upload Note</button>
            </div>
            <div class="filters">
                <select id="noteLevelFilter">
                    <option value="">All Levels</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
                <select id="noteClassFilter">
                    <option value="">All Classes</option>
                    <option value="s1">S1</option>
                    <option value="s2">S2</option>
                    <option value="s3">S3</option>
                    <option value="s4">S4</option>
                    <option value="s5">S5</option>
                    <option value="s6">S6</option>
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="notesTableBody">
                        <tr><td colspan="6" class="loading">Loading notes...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupNotesListeners() {
  const addNoteBtn = document.getElementById("addNoteBtn");
  const noteLevelFilter = document.getElementById("noteLevelFilter");
  const noteClassFilter = document.getElementById("noteClassFilter");

  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", showAddNoteModal);
  }
  if (noteLevelFilter) {
    noteLevelFilter.addEventListener("change", loadNotes);
  }
  if (noteClassFilter) {
    noteClassFilter.addEventListener("change", loadNotes);
  }

  // Event delegation is handled at document level
}

async function loadNotes() {
  try {
    const level = document.getElementById("noteLevelFilter").value;
    const classLevel = document.getElementById("noteClassFilter").value;

    let url = `${API_BASE}/notes`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load notes");

    const data = await response.json();
    allNotes = data.data || [];
    displayNotes(allNotes);
  } catch (error) {
    console.error("Failed to load notes:", error);
    showError("Failed to load notes");
  }
}

function displayNotes(notes) {
  const tbody = document.getElementById("notesTableBody");

  if (notes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="no-data">No notes found</td></tr>';
    return;
  }

  tbody.innerHTML = notes
    .map(
      (note) => `
        <tr>
            <td>${note.title}</td>
            <td>${note.subject}</td>
            <td>${note.level}</td>
            <td>${note.class.toUpperCase()}</td>
            <td>${new Date(note.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-sm btn-primary edit-note-btn" data-note-id="${note.id}">Edit</button>
                <button class="btn-sm btn-danger delete-note-btn" data-note-id="${note.id}">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showAddNoteModal() {
  showNoteModal("Upload Note", null);
}

function editNote(id) {
  const note = allNotes.find((n) => n.id === id);
  if (!note) return;
  showNoteModal("Edit Note", note);
}

function showNoteModal(title, note) {
  const modalContent = `
        <form id="noteForm" enctype="multipart/form-data">
            <input type="hidden" id="noteId" value="${note ? note.id : ""}">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="noteTitle" value="${note ? note.title : ""}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="noteDescription" rows="3">${note ? note.description || "" : ""}</textarea>
            </div>
            <div class="form-group">
                <label>Subject *</label>
                <select id="noteSubject" required>
                    ${getSubjectOptions(note ? note.subject : "")}
                </select>
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="noteLevel" required>
                    <option value="">Select Level</option>
                    <option value="o-level" ${note && note.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${note && note.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class *</label>
                <select id="noteClass" required>
                    <option value="">Select Level First</option>
                </select>
            </div>
            <div class="form-group">
                <label>Combination (A-Level only)</label>
                <input type="text" id="noteCombination" value="${note ? note.combination || "" : ""}" placeholder="e.g., PCM, PCB">
            </div>
            <div class="form-group">
                <label>File ${note ? "" : "*"}</label>
                <input type="file" id="noteFile" accept=".pdf,.doc,.docx,.txt" ${note ? "" : "required"}>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancelNoteBtn">Cancel</button>
                <button type="submit" class="btn-primary">Upload Note</button>
            </div>
        </form>
    `;

  showModal(title, modalContent, () => {
    const noteLevel = document.getElementById("noteLevel");
    if (noteLevel) {
      noteLevel.addEventListener("change", updateNoteClassOptions);
      if (note) {
        updateNoteClassOptions();
        setTimeout(() => {
          document.getElementById("noteClass").value = note.class;
        }, 10);
      }
    }

    const form = document.getElementById("noteForm");
    form.addEventListener("submit", saveNote);

    document
      .getElementById("cancelNoteBtn")
      .addEventListener("click", closeModal);
  });
}

function updateNoteClassOptions() {
  const level = document.getElementById("noteLevel").value;
  const classSelect = document.getElementById("noteClass");

  classSelect.innerHTML = '<option value="">Select Class</option>';

  if (level === "o-level") {
    classSelect.innerHTML += `
            <option value="s1">S1</option>
            <option value="s2">S2</option>
            <option value="s3">S3</option>
            <option value="s4">S4</option>
        `;
  } else if (level === "a-level") {
    classSelect.innerHTML += `
            <option value="s5">S5</option>
            <option value="s6">S6</option>
        `;
  }
}

async function saveNote(event) {
  event.preventDefault();

  const id = document.getElementById("noteId").value;
  const formData = new FormData();

  formData.append("title", document.getElementById("noteTitle").value);
  formData.append(
    "description",
    document.getElementById("noteDescription").value,
  );
  formData.append("subject", document.getElementById("noteSubject").value);
  formData.append("level", document.getElementById("noteLevel").value);
  formData.append("class", document.getElementById("noteClass").value);

  const combination = document.getElementById("noteCombination").value;
  if (combination) formData.append("combination", combination);

  const fileInput = document.getElementById("noteFile");
  if (fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  try {
    const url = id ? `${API_BASE}/notes/${id}` : `${API_BASE}/notes`;
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save note");
    }

    showSuccess(
      id ? "Note updated successfully" : "Note uploaded successfully",
    );
    closeModal();
    loadNotes();
    loadDashboard();
  } catch (error) {
    console.error("Failed to save note:", error);
    showError(error.message || "Failed to save note");
  }
}

async function deleteNote(id) {
  if (!confirm("Are you sure you want to delete this note?")) return;

  try {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete note");

    showSuccess("Note deleted successfully");
    loadNotes();
    loadDashboard();
  } catch (error) {
    console.error("Failed to delete note:", error);
    showError("Failed to delete note");
  }
}

// ============================================
// QUIZZES MANAGEMENT
// ============================================

function renderQuizzesTab() {
  return `
        <div id="quizzes" class="tab-content">
            <div class="section-header">
                <h2>Activity/Quiz Management</h2>
                <button class="btn-primary" id="addQuizBtn">+ Create Activity/Quiz</button>
            </div>
            <div class="filters">
                <select id="quizLevelFilter">
                    <option value="">All Levels</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
                <select id="quizClassFilter">
                    <option value="">All Classes</option>
                    <option value="s1">S1</option>
                    <option value="s2">S2</option>
                    <option value="s3">S3</option>
                    <option value="s4">S4</option>
                    <option value="s5">S5</option>
                    <option value="s6">S6</option>
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Type</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Views</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="quizzesTableBody">
                        <tr><td colspan="7" class="loading">Loading quizzes...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupQuizzesListeners() {
  const addQuizBtn = document.getElementById("addQuizBtn");
  if (addQuizBtn) addQuizBtn.addEventListener("click", showAddQuizModal);

  const levelFilter = document.getElementById("quizLevelFilter");
  if (levelFilter) levelFilter.addEventListener("change", loadQuizzes);

  const classFilter = document.getElementById("quizClassFilter");
  if (classFilter) classFilter.addEventListener("change", loadQuizzes);
}

async function loadQuizzes() {
  try {
    const level = document.getElementById("quizLevelFilter").value;
    const classLevel = document.getElementById("quizClassFilter").value;

    let url = `${API_BASE}/quizzes`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to load quizzes");

    const data = await response.json();
    allQuizzes = data.data || [];
    displayQuizzes(allQuizzes);
  } catch (error) {
    console.error("Failed to load quizzes:", error);
    showError("Failed to load quizzes");
  }
}

function displayQuizzes(quizzes) {
  const tbody = document.getElementById("quizzesTableBody");
  if (quizzes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="no-data">No quizzes found</td></tr>';
    return;
  }

  tbody.innerHTML = quizzes
    .map(
      (quiz) => `
        <tr>
            <td>${quiz.title}</td>
            <td>${quiz.subject}</td>
            <td>${quiz.topic || "-"}</td>
            <td>${quiz.type === "file" ? "📁 File" : "✍️ Text"}</td>
            <td>${quiz.level}</td>
            <td>${quiz.class.toUpperCase()}</td>
            <td>${quiz.views || 0}</td>
            <td>
                <button class="btn-sm btn-primary edit-quiz-btn" data-quiz-id="${quiz.id}">Edit</button>
                <button class="btn-sm btn-danger delete-quiz-btn" data-quiz-id="${quiz.id}">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showAddQuizModal() {
  showQuizModal("Create Activity/Quiz", null);
}

function editQuiz(id) {
  const quiz = allQuizzes.find((q) => q.id === id);
  if (quiz) showQuizModal("Edit Quiz", quiz);
}

function showQuizModal(title, quiz) {
  const modalContent = `
        <form id="quizForm" enctype="multipart/form-data">
            <input type="hidden" id="quizId" value="${quiz ? quiz.id : ""}">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="quizTitle" value="${quiz ? quiz.title : ""}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="quizDescription">${quiz ? quiz.description || "" : ""}</textarea>
            </div>
            <div class="form-group">
                <label>Subject *</label>
                <select id="quizSubject" required>
                    ${getSubjectOptions(quiz ? quiz.subject : "")}
                </select>
            </div>
            <div class="form-group">
                <label>Topic (Optional)</label>
                <input type="text" id="quizTopic" value="${quiz ? quiz.topic || "" : ""}" placeholder="e.g. Algebra, Organic Chemistry">
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="quizType" required>
                    <option value="file" ${quiz && quiz.type === "file" ? "selected" : ""}>File Upload (PDF/DOC)</option>
                    <option value="plain" ${quiz && quiz.type === "plain" ? "selected" : ""}>Plain Text / HTML Content</option>
                </select>
            </div>
            <div class="form-group" id="fileInputGroup" style="${quiz && quiz.type === "plain" ? "display:none" : "display:block"}">
                <label>Quiz File ${quiz && quiz.type === "file" ? "(Optional update)" : "*"}</label>
                <input type="file" id="quizFile" accept=".pdf,.doc,.docx,.txt">
            </div>
            <div class="form-group" id="contentInputGroup" style="${quiz && quiz.type === "plain" ? "display:block" : "display:none"}">
                <label>Type your Question/Content here *</label>
                <textarea id="quizContent" rows="10" placeholder="Type or paste your quiz questions/content here...">${quiz ? quiz.content || "" : ""}</textarea>
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="quizLevel" required>
                    <option value="">Select Level</option>
                    <option value="o-level" ${quiz && quiz.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${quiz && quiz.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class *</label>
                <select id="quizClass" required>
                    <option value="">Select Level First</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save Quiz</button>
            </div>
        </form>
    `;

  showModal(title, modalContent, () => {
    const quizType = document.getElementById("quizType");
    quizType.addEventListener("change", () => {
      document.getElementById("fileInputGroup").style.display =
        quizType.value === "file" ? "block" : "none";
      document.getElementById("contentInputGroup").style.display =
        quizType.value === "plain" ? "block" : "none";
    });

    const quizLevel = document.getElementById("quizLevel");
    quizLevel.addEventListener("change", () =>
      updateClassSelect("quizLevel", "quizClass"),
    );
    if (quiz) {
      updateClassSelect("quizLevel", "quizClass");
      setTimeout(
        () => (document.getElementById("quizClass").value = quiz.class),
        10,
      );
    }

    document.getElementById("quizForm").addEventListener("submit", saveQuiz);
  });
}

async function saveQuiz(event) {
  event.preventDefault();
  const id = document.getElementById("quizId").value;
  const formData = new FormData();

  formData.append("title", document.getElementById("quizTitle").value);
  formData.append(
    "description",
    document.getElementById("quizDescription").value,
  );
  formData.append("subject", document.getElementById("quizSubject").value);
  formData.append("topic", document.getElementById("quizTopic").value);
  formData.append("type", document.getElementById("quizType").value);
  formData.append("level", document.getElementById("quizLevel").value);
  formData.append("class", document.getElementById("quizClass").value);

  if (document.getElementById("quizType").value === "plain") {
    formData.append("content", document.getElementById("quizContent").value);
  } else {
    const file = document.getElementById("quizFile").files[0];
    if (file) formData.append("file", file);
  }

  try {
    const url = id ? `${API_BASE}/quizzes/${id}` : `${API_BASE}/quizzes`;
    const response = await fetch(url, {
      method: id ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.message || "Failed to save quiz");
    }
    showSuccess("Quiz saved successfully");
    closeModal();
    loadQuizzes();
    loadDashboard();
  } catch (error) {
    showError(error.message);
  }
}

async function deleteQuiz(id) {
  if (!confirm("Delete this quiz?")) return;
  try {
    const response = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete quiz");
    showSuccess("Quiz deleted");
    loadQuizzes();
    loadDashboard();
  } catch (error) {
    showError(error.message);
  }
}

// ============================================
// RESOURCES MANAGEMENT
// ============================================

function renderResourcesTab() {
  return `
        <div id="resources" class="tab-content">
            <div class="section-header">
                <h2>Resource Management</h2>
                <button class="btn-primary" id="addResourceBtn">+ Add Resource</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Link/File</th>
                            <th>Subject</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="resourcesTableBody">
                        <tr><td colspan="7" class="loading">Loading resources...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupResourcesListeners() {
  const addResourceBtn = document.getElementById("addResourceBtn");
  if (addResourceBtn)
    addResourceBtn.addEventListener("click", showAddResourceModal);
}

async function loadResources() {
  try {
    const response = await fetch(`${API_BASE}/resources`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed");
    const data = await response.json();
    allResources = data.data || [];
    displayResources(allResources);
  } catch (error) {
    showError("Load failed");
  }
}

function displayResources(resources) {
  const tbody = document.getElementById("resourcesTableBody");
  tbody.innerHTML =
    resources
      .map(
        (res) => `
        <tr>
            <td>${res.title}</td>
            <td>${res.resourceType === "file" ? "📁 File/Video" : "🔗 URL"}</td>
            <td>
                ${res.resourceType === "file"
            ? `<a href="${API_BASE.replace("/api", "")}/${res.filePath}" target="_blank">View File</a>`
            : `<a href="${res.url}" target="_blank">View Link</a>`
          }
            </td>
            <td>${res.subject || "-"}</td>
            <td>${res.level}</td>
            <td>${res.class.toUpperCase()}</td>
            <td>
                <button class="btn-sm btn-primary edit-resource-btn" data-resource-id="${res.id}">Edit</button>
                <button class="btn-sm btn-danger delete-resource-btn" data-resource-id="${res.id}">Delete</button>
            </td>
        </tr>
    `,
      )
      .join("") || '<tr><td colspan="7" class="no-data">No resources</td></tr>';
}

function showAddResourceModal() {
  showResourceModal("Add Resource", null);
}
function editResource(id) {
  const res = allResources.find((r) => r.id === id);
  if (res) showResourceModal("Edit Resource", res);
}

function showResourceModal(title, resource) {
  const modalContent = `
        <form id="resourceForm" enctype="multipart/form-data">
            <input type="hidden" id="resourceId" value="${resource ? resource.id : ""}">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="resourceTitle" value="${resource ? resource.title : ""}" required>
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="resourceType" required>
                    <option value="url" ${resource && resource.resourceType === "url" ? "selected" : ""}>Web Link (URL)</option>
                    <option value="file" ${resource && resource.resourceType === "file" ? "selected" : ""}>File Upload (MP4, PDF, JPG, PNG, etc)</option>
                </select>
            </div>
            <div class="form-group" id="resourceUrlGroup" style="${resource && resource.resourceType === "file" ? "display:none" : "display:block"}">
                <label>URL (e.g. YouTube Link) *</label>
                <input type="text" id="resourceUrl" value="${resource && resource.url ? resource.url : ""}" ${resource && resource.resourceType === "file" ? "" : "required"}>
            </div>
            <div class="form-group" id="resourceFileGroup" style="${resource && resource.resourceType === "file" ? "display:block" : "display:none"}">
                <label>Resource File (MP4 Video, PDF, DOC, JPG, PNG) ${resource && resource.resourceType === "file" ? "(Optional update)" : "*"}</label>
                <input type="file" id="resourceFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.jpeg,.png" ${resource ? "" : (resource && resource.resourceType === "file" ? "" : "")}>
            </div>
            <div class="form-group">
                <label>Subject</label>
                <select id="resourceSubject">
                    ${getSubjectOptions(resource ? resource.subject : "")}
                </select>
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="resourceLevel" required>
                    <option value="o-level" ${resource && resource.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${resource && resource.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class *</label>
                <select id="resourceClass" required>
                    <option value="s1" ${resource && resource.class === "s1" ? "selected" : ""}>S1</option>
                    <option value="s2" ${resource && resource.class === "s2" ? "selected" : ""}>S2</option>
                    <option value="s3" ${resource && resource.class === "s3" ? "selected" : ""}>S3</option>
                    <option value="s4" ${resource && resource.class === "s4" ? "selected" : ""}>S4</option>
                    <option value="s5" ${resource && resource.class === "s5" ? "selected" : ""}>S5</option>
                    <option value="s6" ${resource && resource.class === "s6" ? "selected" : ""}>S6</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
    `;
  showModal(title, modalContent, () => {
    const rType = document.getElementById("resourceType");
    const rUrl = document.getElementById("resourceUrlGroup");
    const rFile = document.getElementById("resourceFileGroup");
    const rUrlInput = document.getElementById("resourceUrl");

    rType.addEventListener("change", () => {
      if (rType.value === "url") {
        rUrl.style.display = "block";
        rFile.style.display = "none";
        rUrlInput.required = true;
      } else {
        rUrl.style.display = "none";
        rFile.style.display = "block";
        rUrlInput.required = false;
      }
    });

    document
      .getElementById("resourceForm")
      .addEventListener("submit", saveResource);
  });
}

async function saveResource(e) {
  e.preventDefault();
  const id = document.getElementById("resourceId").value;

  const formData = new FormData();
  formData.append("title", document.getElementById("resourceTitle").value);
  formData.append("resourceType", document.getElementById("resourceType").value);

  if (document.getElementById("resourceType").value === "url") {
    formData.append("url", document.getElementById("resourceUrl").value);
  } else {
    const fileItem = document.getElementById("resourceFile").files[0];
    if (fileItem) formData.append("file", fileItem);
  }

  formData.append("subject", document.getElementById("resourceSubject").value);
  formData.append("level", document.getElementById("resourceLevel").value);
  formData.append("class", document.getElementById("resourceClass").value);

  try {
    const url = id ? `${API_BASE}/resources/${id}` : `${API_BASE}/resources`;
    const res = await fetch(url, {
      method: id ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    // Parse response
    let resData;
    try {
      resData = await res.json();
    } catch (err) {
      resData = null;
    }

    if (!res.ok) throw new Error(resData ? resData.message : "Save resource failed");
    showSuccess("Resource saved successfully");
    closeModal();
    loadResources();
    loadDashboard();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteResource(id) {
  if (!confirm("Delete?")) return;
  await fetch(`${API_BASE}/resources/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  loadResources();
  loadDashboard();
}

// ============================================
// STREAMS MANAGEMENT (Class Sections)
// ============================================

function renderStreamsTab() {
  return `
        <div id="streams" class="tab-content">
            <div class="section-header">
                <h2>Class Streams (Section Management)</h2>
                <button class="btn-primary" id="addStreamBtn">+ Add Stream</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Stream Name</th>
                            <th>Parent Class</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="streamsTableBody">
                        <tr><td colspan="4" class="loading">Loading streams...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupStreamsListeners() {
  const btn = document.getElementById("addStreamBtn");
  if (btn) btn.addEventListener("click", showAddStreamModal);
}

async function loadStreams() {
  try {
    const res = await fetch(`${API_BASE}/streams`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    allStreams = data.data || [];
    displayStreams(allStreams);
  } catch (e) {
    showError("Streams load failed");
  }
}

function displayStreams(streams) {
  const tbody = document.getElementById("streamsTableBody");
  tbody.innerHTML =
    streams
      .map(
        (s) => `
        <tr>
            <td>${s.name}</td>
            <td>${s.class.toUpperCase()}</td>
            <td>${s.description || "-"}</td>
            <td>
                <button class="btn-sm btn-primary edit-stream-btn" data-stream-id="${s.id}">Edit</button>
                <button class="btn-sm btn-danger delete-stream-btn" data-stream-id="${s.id}">Delete</button>
            </td>
        </tr>
    `,
      )
      .join("") || '<tr><td colspan="4" class="no-data">No streams</td></tr>';
}

function showAddStreamModal() {
  showStreamModal("Add Stream", null);
}
function editStream(id) {
  const s = allStreams.find((x) => x.id === id);
  if (s) showStreamModal("Edit Stream", s);
}

function showStreamModal(title, stream) {
  const content = `
        <form id="streamForm">
            <input type="hidden" id="streamId" value="${stream ? stream.id : ""}">
            <div class="form-group">
                <label>Stream Name (e.g. "S1 A", "North") *</label>
                <input type="text" id="streamName" value="${stream ? stream.name : ""}" required>
            </div>
            <div class="form-group">
                <label>Parent Class (O-Level Only) *</label>
                <select id="streamClass" required>
                    <option value="s1" ${stream && stream.class === "s1" ? "selected" : ""}>S1</option>
                    <option value="s2" ${stream && stream.class === "s2" ? "selected" : ""}>S2</option>
                    <option value="s3" ${stream && stream.class === "s3" ? "selected" : ""}>S3</option>
                    <option value="s4" ${stream && stream.class === "s4" ? "selected" : ""}>S4</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="streamDesc" value="${stream ? stream.description || "" : ""}">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
    `;
  showModal(title, content, () => {
    document
      .getElementById("streamForm")
      .addEventListener("submit", saveStream);
  });
}

async function saveStream(e) {
  e.preventDefault();
  const id = document.getElementById("streamId").value;
  const data = {
    name: document.getElementById("streamName").value,
    class: document.getElementById("streamClass").value,
    description: document.getElementById("streamDesc").value,
  };
  const url = id ? `${API_BASE}/streams/${id}` : `${API_BASE}/streams`;
  await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  closeModal();
  loadStreams();
  loadDashboard();
}

async function deleteStream(id) {
  if (!confirm("Delete stream?")) return;
  await fetch(`${API_BASE}/streams/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  loadStreams();
  loadDashboard();
}

// Helper to update class select based on level
function updateClassSelect(levelId, classId) {
  const level = document.getElementById(levelId).value;
  const classSelect = document.getElementById(classId);
  classSelect.innerHTML = '<option value="">Select Class</option>';
  if (level === "o-level") {
    ["s1", "s2", "s3", "s4"].forEach(
      (c) =>
        (classSelect.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`),
    );
  } else if (level === "a-level") {
    ["s5", "s6"].forEach(
      (c) =>
        (classSelect.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`),
    );
  }
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

// Helper to get subject options for dropdowns
function getSubjectOptions(selectedSubject = "") {
  if (!allSubjects || allSubjects.length === 0) {
    return `<option value="">Please add subjects first</option>`;
  }

  return `
        <option value="">Select Subject</option>
        ${allSubjects
      .map(
        (s) => `
            <option value="${s.name}" ${s.name === selectedSubject ? "selected" : ""}>
                ${s.name} (${s.code})
            </option>
        `,
      )
      .join("")}
    `;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("admin_active_tab");
  window.location.href = "/pages/login.html";
}

function showSuccess(message) {
  showToast(message, "success");
}

function showError(message) {
  showToast(message, "error");
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <div class="toast-content">
            ${type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"} ${message}
        </div>
    `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add("toast-closing");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Refresh current tab data
async function refreshCurrentTab() {
  const btn = document.getElementById("refreshBtn");
  const originalText = btn.innerHTML;
  btn.innerHTML = "🔄 Syncing...";
  btn.disabled = true;

  try {
    // If super admin, always refresh the schools cache on any sync
    if (currentAdmin.role === "super_admin") {
      await loadSchools();
    }

    if (currentTab === "dashboard") await loadDashboard();
    else if (currentTab === "schools") await loadSchools(); // Already handled above but kept for consistency
    else if (currentTab === "students") await loadStudents();
    else if (currentTab === "subjects") await loadSubjects();
    else if (currentTab === "notes") await loadNotes();
    else if (currentTab === "quizzes") await loadQuizzes();
    else if (currentTab === "resources") await loadResources();
    else if (currentTab === "streams") await loadStreams();
    else if (currentTab === "discussions") await loadDiscussions();

    showToast("Data synchronized successfully", "success");
  } catch (error) {
    showError("Sync failed: " + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function showModal(title, content, onOpen) {
  // Cleanup any existing modal first
  closeModal();

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

// ============================================
// PASSWORD RESET REQUESTS
// ============================================

function renderResetRequestsTab() {
  return `
        <div id="reset-requests" class="tab-content">
            <div class="section-header">
                <h2>Password Reset Requests</h2>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Requested At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="resetRequestsTableBody">
                        <tr><td colspan="4" class="loading">Loading requests...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function loadResetRequests() {
  try {
    const response = await fetch(`${API_BASE}/auth/reset-requests`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load reset requests");

    const data = await response.json();
    displayResetRequests(data.data || []);
  } catch (error) {
    console.error("Failed to load reset requests:", error);
    showError("Failed to load reset requests");
  }
}

function displayResetRequests(requests) {
  const tbody = document.getElementById("resetRequestsTableBody");

  if (!tbody) return;

  if (requests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="no-data">No pending reset requests found</td></tr>';
    return;
  }

  tbody.innerHTML = requests
    .map(
      (request) => `
        <tr>
            <td>${request.name}</td>
            <td>${request.email}</td>
            <td>${new Date(request.resetRequestedAt).toLocaleString()}</td>
            <td>
                <button class="btn-sm btn-success reset-password-btn" 
                    data-student-id="${request.id}" 
                    data-student-name="${request.name}">
                    Reset Password
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

async function resetStudentPassword(id, name) {
  const newPassword = prompt(`Enter new password for ${name}:`, "123456");
  if (!newPassword) return;

  try {
    const response = await fetch(`${API_BASE}/auth/reset-user/${id}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await response.json();

    if (!response.ok)
      throw new Error(data.message || "Failed to reset password");

    showSuccess(data.message);
    loadResetRequests();
    loadDashboard();
  } catch (error) {
    showError(error.message || "Failed to reset password");
  }
}

// ============================================
// SYSTEM ACTIVATION
// ============================================

function renderActivationTab() {
  return `
        <div id="activation" class="tab-content">
            <div class="section-header">
                <h2>System Activation & License</h2>
                <div class="badge-container" id="activationStatusBadge">
                    <span class="badge badge-warning">Checking Status...</span>
                </div>
            </div>

            <div class="activation-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="activation-card" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <h3>License Information</h3>
                    <div id="licenseInfo" style="margin-top: 1.5rem;">
                        <p>Loading details...</p>
                    </div>
                </div>

                <div class="activation-card" id="activationFormContainer" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: none;">
                    <h3>Enter Activation Key</h3>
                    <p style="color: #666; margin-bottom: 1.5rem; font-size: 0.9rem;">Please enter the activation key provided by your distributor.</p>
                    <form id="activationForm">
                        <div class="form-group">
                            <label>Activation Key</label>
                            <input type="text" id="licenseKeyInput" placeholder="NSOMA-XXXXX-XXXXX" required 
                                   style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 1.1rem;">
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; padding: 12px;">Activate System</button>
                    </form>
                </div>

                <div class="activation-card" id="activatedMessage" style="background: #e7f3ff; padding: 2rem; border-radius: 12px; border-left: 5px solid #2196f3; display: none;">
                    <h3 style="color: #2196f3;">✅ System Activated</h3>
                    <p style="margin-top: 1rem;">This system is licensed for full usage. No further action is required.</p>
                </div>
            </div>
            
            <div class="info-section" style="margin-top: 3rem; background: #fff8e1; padding: 1.5rem; border-radius: 8px; border-left: 5px solid #ffc107;">
                <h4>💡 Trial Period Terms</h4>
                <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: #555;">
                    <li>The system allows for a 60-day full evaluation period from the date of first installation.</li>
                    <li>After 60 days, access to all materials will be restricted until an activation key is provided.</li>
                    <li>Data and notes are preserved even after expiration, but remain locked until activation.</li>
                </ul>
            </div>
        </div>
    `;
}

async function loadActivationStatus() {
  try {
    const response = await fetch(`${API_BASE}/system/status`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error("Failed to load system status");

    const { data } = await response.json();
    const { isActivated, installationDate, daysRemaining } = data;

    const badgeContainer = document.getElementById("activationStatusBadge");
    const licenseInfo = document.getElementById("licenseInfo");
    const formContainer = document.getElementById("activationFormContainer");
    const activatedMessage = document.getElementById("activatedMessage");

    if (isActivated) {
      badgeContainer.innerHTML = '<span class="badge badge-success" style="padding: 8px 15px; font-size: 1rem;">ACTIVE (Full Version)</span>';
      licenseInfo.innerHTML = `
                <div style="margin-bottom: 1rem;"><strong style="color: #555;">Status:</strong> <span style="color: #28a745; font-weight: bold;">Full License</span></div>
                <div style="margin-bottom: 1rem;"><strong style="color: #555;">Activated On:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong style="color: #555;">Expiration:</strong> <span style="color: #28a745;">Perpetual / Lifetime</span></div>
            `;
      activatedMessage.style.display = "block";
      formContainer.style.display = "none";
    } else {
      const isExpired = daysRemaining <= 0;
      badgeContainer.innerHTML = `<span class="badge ${isExpired ? "badge-danger" : "badge-warning"}" style="padding: 8px 15px; font-size: 1rem;">${isExpired ? "EXPIRED" : "TRIAL MODE"}</span>`;

      licenseInfo.innerHTML = `
                <div style="margin-bottom: 1rem;"><strong style="color: #555;">Installation Date:</strong> ${new Date(installationDate).toLocaleDateString()}</div>
                <div style="margin-bottom: 1rem;"><strong style="color: #555;">Status:</strong> <span style="color: ${isExpired ? "#d63031" : "#e67e22"}; font-weight: bold;">${isExpired ? "Expired" : "Active Trial"}</span></div>
                <div style="margin-bottom: 1rem;"><strong style="color: #555;">Days Remaining:</strong> <span style="font-size: 1.5rem; font-weight: bold; color: ${isExpired ? "#d63031" : "#28a745"};">${daysRemaining}</span></div>
            `;
      formContainer.style.display = "block";
      activatedMessage.style.display = "none";

      // Setup form listener
      const form = document.getElementById("activationForm");
      if (form) {
        form.addEventListener("submit", activateSystem);
      }
    }
  } catch (error) {
    console.error("Error loading activation status:", error);
    showError("Failed to load activation data");
  }
}

async function activateSystem(e) {
  e.preventDefault();
  const key = document.getElementById("licenseKeyInput").value.trim();

  if (!key) return;

  try {
    const response = await fetch(`${API_BASE}/system/activate`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ licenseKey: key })
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess(data.message || "System activated successfully!");
      loadActivationStatus();
      loadDashboard();
    } else {
      showError(data.message || "Invalid activation key. Please check and try again.");
    }
  } catch (error) {
    console.error("Activation failed:", error);
    showError("An error occurred during activation.");
  }
}
// ============================================
// SCHOOLS MANAGEMENT (SUPER ADMIN ONLY)
// ============================================

function renderSchoolsTab() {
  return `
        <div id="schools" class="tab-content">
            <div class="section-header">
                <h2>Platform Management - Schools</h2>
                <button class="btn-primary" id="addSchoolBtn">+ Onboard New School</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>School Name</th>
                            <th>Slug/Domain</th>
                            <th>Activation Status</th>
                            <th>Subscription Ends</th>
                            <th>Features</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="schoolsTableBody">
                        <tr><td colspan="6" class="loading">Loading schools...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="section-header" style="margin-top: 3rem;">
                <h2>Offline License Generator</h2>
            </div>
            <div class="stat-card" style="max-width: 500px;">
                <p>Generate activation keys for offline laboratory installations.</p>
                <div class="form-group">
                    <label>Duration (Days)</label>
                    <select id="licenseDuration">
                        <option value="365">1 Year (365 Days)</option>
                        <option value="730">2 Years (730 Days)</option>
                        <option value="9999">Lifetime (Perpetual)</option>
                    </select>
                </div>
                <button class="btn-primary" id="genLicenseBtn">Generate Key</button>
                <div id="generatedKeyDisplay" style="margin-top: 1rem; font-family: monospace; font-size: 1.2rem; color: #2196f3; font-weight: bold;"></div>
            </div>
        </div>
    `;
}

function setupSchoolsListeners() {
  const addBtn = document.getElementById("addSchoolBtn");
  if (addBtn) addBtn.addEventListener("click", showAddSchoolModal);

  const genBtn = document.getElementById("genLicenseBtn");
  if (genBtn) genBtn.addEventListener("click", generateLicenseKey);
}

async function loadSchools() {
  try {
    const res = await fetch(`${API_BASE}/super-admin/schools`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    const schools = data.data || [];
    allSchools = schools; // Update global cache for user creation dropdown
    console.log(`[SUPER-ADMIN] Schools list refreshed: ${allSchools.length} schools loaded.`);

    const tbody = document.getElementById("schoolsTableBody");
    if (schools.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No schools onboarded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = schools
      .map(
        (s) => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td><code>${s.slug}</code></td>
            <td>
                <span class="badge ${s.isActive ? "badge-success" : "badge-danger"}">
                    ${s.isActive ? "ACTIVE" : "SUSPENDED"}
                </span>
            </td>
            <td>${s.subscriptionExpiresAt ? new Date(s.subscriptionExpiresAt).toLocaleDateString() : "No Expiry"}</td>
            <td>
                <span class="badge ${s.isSaaS ? "badge-info" : "badge-secondary"}">
                    ${s.isSaaS ? "Cloud / SaaS" : "Standalone Lab"}
                </span>
            </td>
            <td>
                <button class="btn-sm ${s.isActive ? "btn-danger" : "btn-success"}" onclick="toggleSchoolStatus('${s.id}', ${s.isActive})">
                    ${s.isActive ? "Suspend" : "Restore"}
                </button>
                <button class="btn-sm btn-primary" onclick="showAddUserModal('${s.id}')">Add Admin</button>
                <button class="btn-sm btn-info" onclick="showRevenueModal('${s.id}', '${s.name}')">💰 Revenue</button>
                <button class="btn-sm btn-danger" onclick="deleteSchool('${s.id}', '${s.name}')">🗑 Delete</button>
            </td>
        </tr>
    `,
      )
      .join("");
  } catch (e) {
    showError("Failed to load schools");
  }
}

function showAddSchoolModal() {
  const content = `
        <form id="schoolForm">
            <div class="form-group">
                <label>School Name *</label>
                <input type="text" id="schName" placeholder="e.g. Makerere College School" required>
            </div>
            <div class="form-group">
                <label>Slug (Subdomain) *</label>
                <input type="text" id="schSlug" placeholder="e.g. makerere-college" required>
            </div>
            <div class="form-group">
                <label>Deployment Mode</label>
                <select id="schMode">
                    <option value="saas">Cloud SaaS (Multi-tenant)</option>
                    <option value="standalone">Standalone Lab (Single-school)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Initial Subscription Days (365 default)</label>
                <input type="number" id="schDays" value="365">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Provision School</button>
            </div>
        </form>
    `;
  showModal("Onboard New School", content, () => {
    document.getElementById("schoolForm").addEventListener("submit", saveSchool);
  });
}

async function saveSchool(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById("schName").value,
    slug: document.getElementById("schSlug").value,
    isSaaS: document.getElementById("schMode").value === "saas",
    subscriptionDays: parseInt(document.getElementById("schDays").value) || 365,
  };

  try {
    const res = await fetch(`${API_BASE}/super-admin/schools`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to provision school");
    }

    showSuccess("School onboarded successfully");
    closeModal();
    await loadSchools();
    await loadDashboard();
  } catch (err) {
    showError(err.message);
  }
}

async function toggleSchoolStatus(id, currentStatus) {
  const action = currentStatus ? "SUSPEND" : "RESTORE";
  if (!confirm(`Are you sure you want to ${action} this school?`)) return;

  try {
    const res = await fetch(`${API_BASE}/super-admin/schools/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive: !currentStatus }),
    });

    if (!res.ok) throw new Error("Failed to update school status");
    showSuccess(`School ${action === "SUSPEND" ? "suspended (Kill Switch activated)" : "restored"}`);
    loadSchools();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteSchool(id, name) {
  if (!confirm(`⚠️ PERMANENTLY DELETE "${name}"?\n\nThis cannot be undone.`)) return;
  const confirmName = prompt(`Type the school name exactly to confirm:\n"${name}"`);
  if (confirmName !== name) { showError("Name did not match. Deletion cancelled."); return; }
  try {
    const res = await fetch(`${API_BASE}/super-admin/schools/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete school");
    showSuccess(data.message || `School "${name}" deleted.`);
    await loadSchools(); await loadDashboard();
  } catch (err) { showError(err.message); }
}

let revenueChartInstance = null;

async function showRevenueModal(schoolId, schoolName) {
  try {
    const res = await fetch(`${API_BASE}/super-admin/schools/${schoolId}/revenue`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const d = data.data;
    const content = `
      <div>
        <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;">${d.totalStudents}</div><div style="font-size:.75rem;">Total Students</div></div>
          <div style="flex:1;min-width:120px;background:linear-gradient(135deg,#11998e,#38ef7d);color:#fff;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;">${d.confirmedStudents}</div><div style="font-size:.75rem;">Confirmed</div></div>
          <div style="flex:1;min-width:120px;background:linear-gradient(135deg,#f7971e,#ffd200);color:#fff;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;">${d.pendingStudents}</div><div style="font-size:.75rem;">Pending</div></div>
          <div style="flex:1;min-width:120px;background:linear-gradient(135deg,#fc4a1a,#f7b733);color:#fff;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:1rem;font-weight:700;">UGX ${d.expectedRevenue.toLocaleString()}</div><div style="font-size:.75rem;">Expected Revenue</div></div>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
          <div style="flex:1;min-width:180px;"><canvas id="revenueChart" width="200" height="200"></canvas></div>
          <div style="flex:2;min-width:200px;">
            <h4>💰 Fee Per Student (UGX)</h4>
            <p style="color:#666;font-size:.82rem;">Only <strong>students</strong> are charged. Teachers and admins are excluded from billing.</p>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <input type="number" id="feeInput" value="${d.feePerStudent}" min="0" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;">
              <button onclick="saveSchoolFee('${schoolId}')" class="btn-primary" style="padding:8px 14px;">Save</button>
            </div>
            <p style="margin-top:10px;color:#888;font-size:.8rem;">
              UGX <span id="feePreview">${d.feePerStudent.toLocaleString()}</span> × ${d.totalStudents} students = <strong id="totalPreview">UGX ${d.expectedRevenue.toLocaleString()}</strong>
            </p>
          </div>
        </div>
      </div>`;
    showModal(`💰 Revenue — ${schoolName}`, content, () => {
      const ctx = document.getElementById("revenueChart");
      if (!ctx) return;
      if (revenueChartInstance) revenueChartInstance.destroy();
      revenueChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Confirmed", "Pending"],
          datasets: [{ data: [d.confirmedStudents || 0, d.pendingStudents || 0], backgroundColor: ["#11998e", "#f7971e"], borderWidth: 3, borderColor: "#fff" }]
        },
        options: { responsive: false, plugins: { legend: { position: "bottom" } } }
      });
      const feeInput = document.getElementById("feeInput");
      if (feeInput) {
        feeInput.addEventListener("input", () => {
          const fee = parseInt(feeInput.value) || 0;
          document.getElementById("feePreview").textContent = fee.toLocaleString();
          document.getElementById("totalPreview").textContent = `UGX ${(fee * d.totalStudents).toLocaleString()}`;
        });
      }
    });
  } catch (err) { showError("Could not load revenue data: " + err.message); }
}

async function saveSchoolFee(schoolId) {
  const feeInput = document.getElementById("feeInput");
  const fee = parseInt(feeInput.value);
  if (isNaN(fee) || fee < 0) return showError("Please enter a valid fee amount.");
  try {
    const res = await fetch(`${API_BASE}/super-admin/schools/${schoolId}/fee`, {
      method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ feePerStudent: fee })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showSuccess(data.message || "Fee updated!");
  } catch (err) { showError(err.message); }
}

async function generateLicenseKey() {
  const days = document.getElementById("licenseDuration").value;
  try {
    const res = await fetch(`${API_BASE}/super-admin/license`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ days: parseInt(days) }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("generatedKeyDisplay").textContent = data.data.licenseKey;
      showSuccess("License key generated!");
    }
  } catch (e) {
    showError("Failed to generate license key");
  }
}

// ============================================
// DISCUSSIONS & MEETINGS MANAGEMENT
// ============================================

function renderDiscussionsTab() {
  return `
        <div id="discussions" class="tab-content">
            <div class="section-header">
                <h2>Seminars, Meetings & Discussions</h2>
                <button class="btn-primary" id="addDiscussionBtn">+ Create New Meeting</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Level/Class</th>
                            <th>Meeting Link</th>
                            <th>Host</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="discussionsTableBody">
                        <tr><td colspan="7" class="loading">Loading discussions...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupDiscussionsListeners() {
  const addBtn = document.getElementById("addDiscussionBtn");
  if (addBtn) addBtn.addEventListener("click", () => showAddDiscussionModal());
}

async function loadDiscussions() {
  try {
    const res = await fetch(`${API_BASE}/discussions`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    displayDiscussions(data.data || []);
  } catch (error) {
    showError("Failed to load discussions");
  }
}

function displayDiscussions(discussions) {
  const tbody = document.getElementById("discussionsTableBody");
  if (!tbody) return;

  if (discussions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">No meetings scheduled yet.</td></tr>';
    return;
  }

  tbody.innerHTML = discussions
    .map(
      (d) => `
        <tr>
            <td>
                <strong>${d.title}</strong><br>
                <small>${d.description || ""}</small>
            </td>
            <td>${d.subject ? d.subject.name : "Unlinked"}</td>
            <td>${d.level.toUpperCase()} - ${d.class.toUpperCase()}</td>
            <td>
                <a href="${d.meetingLink}" target="_blank" class="text-primary">Join Meeting 🔗</a>
            </td>
            <td>${d.createdBy ? d.createdBy.name : "System"}</td>
            <td>
                <span class="badge badge-${d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "warning"}">
                    ${d.status.toUpperCase()}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    ${d.status === "pending" ? `
                        <button class="btn-sm btn-success approve-discussion-btn" data-discussion-id="${d.id}">Approve</button>
                        <button class="btn-sm btn-danger reject-discussion-btn" data-discussion-id="${d.id}">Reject</button>
                    ` : ""}
                    <button class="btn-sm btn-primary edit-discussion-btn" data-discussion-id="${d.id}">Edit</button>
                    <button class="btn-sm btn-danger delete-discussion-btn" data-discussion-id="${d.id}">Delete</button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("");
}

async function showAddDiscussionModal(id = null) {
  let discussion = null;
  if (id) {
    // Find discussion in local cache or fetch
  }

  const title = id ? "Edit Meeting" : "Schedule New Meeting/Seminar";

  const subjectOptions = allSubjects.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join("");

  const content = `
        <form id="discussionForm">
            <input type="hidden" id="discId" value="${id || ""}">
            <div class="form-group">
                <label>Meeting Title</label>
                <input type="text" id="discTitle" required placeholder="e.g. Physics Seminar on Mechanics">
            </div>
            <div class="form-group">
                <label>Linked Subject</label>
                <select id="discSubject" required>
                    <option value="">Select Subject</option>
                    ${subjectOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Level</label>
                <select id="discLevel" required onchange="updateClassSelect('discLevel', 'discClass')">
                    <option value="">Select Level</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class</label>
                <select id="discClass" required>
                    <option value="">Select Class</option>
                </select>
            </div>
            <div class="form-group">
                <label>Meeting Link (Zoom/Google Meet/etc)</label>
                <input type="url" id="discLink" required placeholder="https://zoom.us/j/...">
            </div>
            <div class="form-group">
                <label>Description / Agenda</label>
                <textarea id="discDesc" rows="3"></textarea>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn-primary">Save Meeting</button>
            </div>
        </form>
    `;

  showModal(title, content, () => {
    document.getElementById("discussionForm").addEventListener("submit", saveDiscussion);
  });
}

async function saveDiscussion(e) {
  e.preventDefault();
  const id = document.getElementById("discId").value;
  const data = {
    title: document.getElementById("discTitle").value.trim(),
    subjectId: document.getElementById("discSubject").value,
    level: document.getElementById("discLevel").value,
    class: document.getElementById("discClass").value,
    meetingLink: document.getElementById("discLink").value.trim(),
    description: document.getElementById("discDesc").value.trim(),
  };

  const url = id ? `${API_BASE}/discussions/${id}` : `${API_BASE}/discussions`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const parsed = await res.json();
    if (res.ok) {
      showSuccess(parsed.message || "Meeting saved successfully");
      closeModal();
      loadDiscussions();
    } else {
      showError(parsed.message || "Failed to save meeting");
    }
  } catch (error) {
    showError("Network error while saving");
  }
}

async function deleteDiscussion(id) {
  if (!confirm("Are you sure you want to delete this meeting? Students will lose access.")) return;
  try {
    const res = await fetch(`${API_BASE}/discussions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      showSuccess("Meeting deleted");
      loadDiscussions();
    }
  } catch (error) {
    showError("Delete failed");
  }
}

async function updateDiscussionStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/discussions/${id}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showSuccess(`Meeting ${status}`);
      loadDiscussions();
    }
  } catch (error) {
    showError("Status update failed");
  }
}
