document.addEventListener("DOMContentLoaded", async () => {
  const quizzesGrid = document.getElementById("quizzesGrid");
  const searchInput = document.getElementById("searchInput");
  const subjectFilter = document.getElementById("subjectFilter");
  const filterBtn = document.getElementById("filterBtn");
  const resetBtn = document.getElementById("resetBtn");
  const quizModal = new bootstrap.Modal(
    document.getElementById("quizViewModal"),
  );

  let currentUser = null;
  const token = localStorage.getItem("token");

  // Check auth
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Load Student Info and Quizzes
  const init = async () => {
    try {
      // suppress redirect so we can show alert
      const response = await authFetch("/api/auth/me", {}, { redirect: false });
      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        window.location.href = "login.html";
        return;
      }
      const data = await response.json();
      if (data.success) {
        currentUser = data.data;
        // If it's an admin trying to view as student, just show all
        // but usually students have class/level info.
        loadQuizzes();
        loadSubjects();
      } else {
        window.location.href = "login.html";
      }
    } catch (error) {
      console.error("Initialization error:", error);
      window.location.href = "login.html";
    }
  };

  const loadQuizzes = async () => {
    try {
      quizzesGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>`;

      const params = {
        search: searchInput.value,
        subject: subjectFilter.value,
      };

      // Apply student filters if available
      if (currentUser && currentUser.role === "student") {
        params.level = currentUser.level;
        params.class = currentUser.class;
        if (currentUser.stream) params.stream = currentUser.stream;
        if (currentUser.classStream)
          params.classStream = currentUser.classStream;
      }

      const queryParams = new URLSearchParams(params);
      const response = await authFetch(
        `/api/quizzes?${queryParams.toString()}`,
        {},
        { redirect: false },
      );
      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        window.location.href = "login.html";
        return;
      }
      const data = await response.json();
      if (data.success) {
        renderQuizzes(data.data);
      } else {
        quizzesGrid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load quizzes</div>`;
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
      quizzesGrid.innerHTML = `<div class="col-12 text-center text-danger">Error connecting to server</div>`;
    }
  };

  const loadSubjects = async () => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams({
        level: currentUser.level || "",
        class: currentUser.class || "",
      });
      const response = await authFetch(
        `/api/subjects?${params.toString()}`,
        {},
        { redirect: false },
      );
      if (response.status === 401) {
        // if subject list fails for auth reasons, we don't need to block
        return;
      }
      const data = await response.json();
      if (data.success) {
        subjectFilter.innerHTML = '<option value="">All Subjects</option>';
        data.data.forEach((sub) => {
          subjectFilter.innerHTML += `<option value="${sub.name}">${sub.name}</option>`;
        });
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const renderQuizzes = (quizzes) => {
    if (quizzes.length === 0) {
      quizzesGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="mb-3 fs-1">📚</div>
                    <h4 class="text-secondary">No quizzes available for you yet</h4>
                    <p class="text-muted">Check back later or try a different search!</p>
                </div>`;
      return;
    }

    quizzesGrid.innerHTML = quizzes
      .map(
        (quiz) => `
            <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 hover-shadow transition">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="mb-3">
                            <span class="badge bg-secondary-subtle text-secondary rounded-pill px-3">
                                ${quiz.subject}
                            </span>
                        </div>
                        <h5 class="card-title fw-bold mb-2">${quiz.title}</h5>
                        <p class="card-text text-secondary small mb-4 text-truncate-2">${quiz.description || "Practice your skills with this quiz."}</p>
                        
                        <div class="mt-auto d-grid gap-2">
                            ${
                              quiz.type === "plain"
                                ? `<button class="btn btn-primary rounded-pill view-text-btn" data-id="${quiz.id}">View Online</button>`
                                : `<button class="btn btn-primary rounded-pill view-file-btn" data-id="${quiz.id}">View PDF</button>
                                   <button class="btn btn-outline-primary rounded-pill download-file-btn" data-id="${quiz.id}">Download</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    // Attach text view handlers
    document.querySelectorAll(".view-text-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        try {
          const response = await authFetch(
            `/api/quizzes/${id}`,
            {},
            { redirect: false },
          );
          if (response.status === 401) {
            // session expired or invalid token
            alert("Your session has expired. Please log in again.");
            window.location.href = getLoginRedirectUrl();
            return;
          }
          const data = await response.json();
          if (data.success) {
            document.getElementById("quizModalTitle").textContent =
              data.data.title;
            document.getElementById("quizModalContent").textContent =
              data.data.content;
            quizModal.show();
          } else {
            alert("Unable to load quiz: " + (data.message || "Unknown"));
          }
        } catch (error) {
          console.error("Error fetching quiz content:", error);
          // network issues etc.
          alert("Unable to load quiz. Please try again later.");
        }
      });
    });
  };

  filterBtn.addEventListener("click", loadQuizzes);
  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    subjectFilter.value = "";
    loadQuizzes();
  });

  // handle authenticated file view/download
  quizzesGrid.addEventListener("click", async (e) => {
    const viewBtn = e.target.closest(".view-file-btn");
    const downloadBtn = e.target.closest(".download-file-btn");
    if (viewBtn) {
      const id = viewBtn.dataset.id;
      try {
        const res = await authFetch(
          `/api/quizzes/${id}/view`,
          {},
          { redirect: false },
        );
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          window.location.href = getLoginRedirectUrl();
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } catch (err) {
        console.error("Error opening file quiz:", err);
        alert("Unable to load file.");
      }
    } else if (downloadBtn) {
      const id = downloadBtn.dataset.id;
      try {
        const res = await authFetch(
          `/api/quizzes/${id}/download`,
          {},
          { redirect: false },
        );
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          window.location.href = getLoginRedirectUrl();
          return;
        }
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "";
        a.click();
      } catch (err) {
        console.error("Error downloading file quiz:", err);
        alert("Unable to download file.");
      }
    }
  });

  init();

  // Logout handler
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
});
