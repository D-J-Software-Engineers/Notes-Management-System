document.addEventListener("DOMContentLoaded", async () => {
  const quizzesGrid = document.getElementById("quizzesGrid");
  const searchInput = document.getElementById("searchInput");
  const levelFilter = document.getElementById("levelFilter");
  const classFilter = document.getElementById("classFilter");
  const filterBtn = document.getElementById("filterBtn");
  const resetBtn = document.getElementById("resetBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let quizToDelete = null;
  const token = localStorage.getItem("token");

  // Check auth
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Load Quizzes
  const loadQuizzes = async () => {
    try {
      quizzesGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>`;

      const queryParams = new URLSearchParams({
        search: searchInput.value,
        level: levelFilter.value,
        class: classFilter.value,
      });

      const response = await authFetch(
        `/api/quizzes?${queryParams.toString()}`,
      );

      if (response.success) {
        renderQuizzes(response.data);
      } else {
        quizzesGrid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load quizzes: ${response.message}</div>`;
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
      quizzesGrid.innerHTML = `<div class="col-12 text-center text-danger">Error connecting to server</div>`;
    }
  };

  const renderQuizzes = (quizzes) => {
    if (quizzes.length === 0) {
      quizzesGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="mb-3 fs-1">📝</div>
                    <h4 class="text-secondary">No quizzes found</h4>
                    <p class="text-muted">Start by adding your first quiz!</p>
                </div>`;
      return;
    }

    quizzesGrid.innerHTML = quizzes
      .map(
        (quiz) => `
            <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 hover-shadow transition">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="badge bg-primary-subtle text-primary rounded-pill px-3">
                                ${quiz.subject}
                            </span>
                            <div class="dropdown">
                                <button class="btn btn-link text-secondary p-0" data-bs-toggle="dropdown">
                                    ⋮
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end border-0 shadow rounded-3">
                                    <li><a class="dropdown-item py-2" href="/api/quizzes/${quiz.id}/${quiz.type === "file" ? "view" : "view"}" target="_blank">View</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><button class="dropdown-item py-2 text-danger delete-quiz-btn" data-id="${quiz.id}">Delete</button></li>
                                </ul>
                            </div>
                        </div>
                        <h5 class="card-title fw-bold mb-2">${quiz.title}</h5>
                        <p class="card-text text-secondary small mb-3 text-truncate-2">${quiz.description || "No description provided."}</p>
                        
                        <div class="d-flex gap-2 mb-3">
                            <span class="badge bg-light text-dark border rounded-pill px-2">
                                ${quiz.level.toUpperCase()}
                            </span>
                            <span class="badge bg-light text-dark border rounded-pill px-2">
                                ${quiz.class.toUpperCase()}
                            </span>
                            <span class="badge bg-info-subtle text-info border-0 rounded-pill px-2">
                                ${quiz.type === "file" ? "📁 File" : "✍️ Text"}
                            </span>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                            <small class="text-muted">👁️ ${quiz.views || 0} views</small>
                            <small class="text-muted">${new Date(quiz.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    // Attach delete handlers
    document.querySelectorAll(".delete-quiz-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        quizToDelete = e.target.dataset.id;
        const modal = new bootstrap.Modal(
          document.getElementById("deleteModal"),
        );
        modal.show();
      });
    });
  };

  // Filter Listeners
  levelFilter.addEventListener("change", () => {
    const level = levelFilter.value;
    classFilter.innerHTML = '<option value="">All Classes</option>';
    if (level === "o-level") {
      ["s1", "s2", "s3", "s4"].forEach(
        (c) =>
          (classFilter.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`),
      );
    } else if (level === "a-level") {
      ["s5", "s6"].forEach(
        (c) =>
          (classFilter.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`),
      );
    }
  });

  filterBtn.addEventListener("click", loadQuizzes);
  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    levelFilter.value = "";
    classFilter.innerHTML = '<option value="">All Classes</option>';
    loadQuizzes();
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!quizToDelete) return;

    try {
      const response = await authFetch(`/api/quizzes/${quizToDelete}`, {
        method: "DELETE",
      });

      if (response.success) {
        bootstrap.Modal.getInstance(
          document.getElementById("deleteModal"),
        ).hide();
        loadQuizzes();
      } else {
        alert("Failed to delete quiz: " + response.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting quiz");
    }
  });

  // Initial Load
  loadQuizzes();

  // Logout handler
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
});
