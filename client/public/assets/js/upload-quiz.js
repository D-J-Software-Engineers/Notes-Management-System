document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadQuizForm");
  const levelSelect = document.getElementById("level");
  const classSelect = document.getElementById("class");
  const streamSection = document.getElementById("streamSection");
  const streamSelect = document.getElementById("stream");
  const subjectSelect = document.getElementById("subject");
  const typeRadios = document.getElementsByName("type");
  const fileSection = document.getElementById("fileUploadSection");
  const plainTextSection = document.getElementById("plainTextSection");
  const quizFile = document.getElementById("file");
  const quizContent = document.getElementById("content");

  // Check authentication
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!token || (user && user.role !== "admin")) {
    window.location.href = "login.html?role=admin";
    return;
  }

  // Handle Level Change
  levelSelect.addEventListener("change", () => {
    const level = levelSelect.value;
    classSelect.innerHTML = '<option value="">Select Class</option>';
    classSelect.disabled = !level;
    subjectSelect.disabled = true;
    subjectSelect.innerHTML = '<option value="">Select Class First</option>';

    if (level === "o-level") {
      ["s1", "s2", "s3", "s4"].forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c.toUpperCase();
        classSelect.appendChild(opt);
      });
      streamSection.classList.add("d-none");
      streamSelect.required = false;
    } else if (level === "a-level") {
      ["s5", "s6"].forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c.toUpperCase();
        classSelect.appendChild(opt);
      });
      streamSection.classList.remove("d-none");
      streamSelect.required = true;
    }
  });

  // Handle Class or Stream Change to fetch subjects
  const updateSubjects = async () => {
    const level = levelSelect.value;
    const classVal = classSelect.value;
    const stream = streamSelect.value;

    if (!level || !classVal || (level === "a-level" && !stream)) {
      subjectSelect.disabled = true;
      subjectSelect.innerHTML =
        '<option value="">Select Class & Stream First</option>';
      return;
    }

    const previous = subjectSelect.value;
    try {
      subjectSelect.innerHTML = '<option value="">Loading subjects...</option>';
      const url = `/api/subjects?level=${level}&class=${classVal}${stream ? `&stream=${stream}` : ""}`;
      const response = await authFetch(url);

      if (response.success && response.data.length > 0) {
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        response.data.forEach((sub) => {
          const opt = document.createElement("option");
          opt.value = sub.name;
          opt.textContent = sub.name;
          subjectSelect.appendChild(opt);
        });
        subjectSelect.disabled = false;
        // restore previous if still available
        if (previous) subjectSelect.value = previous;
      } else {
        subjectSelect.innerHTML = '<option value="">No subjects found</option>';
        subjectSelect.disabled = true;
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showStatus("Error loading subjects", "danger");
    }
  };

  classSelect.addEventListener("change", updateSubjects);
  streamSelect.addEventListener("change", updateSubjects);

  // Handle Content Type Change
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "file") {
        fileSection.classList.remove("d-none");
        plainTextSection.classList.add("d-none");
        quizFile.required = true;
        quizContent.required = false;
      } else {
        fileSection.classList.add("d-none");
        plainTextSection.classList.remove("d-none");
        quizFile.required = false;
        quizContent.required = true;
      }
    });
  });

  // Initial requirements
  quizFile.required = true;

  // Handle Form Submission
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const spinner = document.getElementById("submitSpinner");

    const formData = new FormData();
    formData.append("title", document.getElementById("title").value);
    formData.append(
      "description",
      document.getElementById("description").value,
    );
    formData.append("level", levelSelect.value);
    formData.append("class", classSelect.value);
    formData.append("subject", subjectSelect.value);

    const type = Array.from(typeRadios).find((r) => r.checked).value;
    formData.append("type", type);

    if (levelSelect.value === "a-level") {
      formData.append("stream", streamSelect.value);
    }

    if (type === "file") {
      if (!quizFile.files[0]) {
        showStatusModal("Error", "Please select a file to upload", "error");
        return;
      }
      formData.append("file", quizFile.files[0]);
    } else {
      if (!quizContent.value || quizContent.value.trim() === "") {
        showStatusModal(
          "Error",
          "Please provide quiz questions for a plain text quiz",
          "error",
        );
        return;
      }
      formData.append("content", quizContent.value);
    }

    try {
      submitBtn.disabled = true;
      spinner.classList.remove("d-none");

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showStatusModal("Success", "Quiz created successfully!", "success");
        uploadForm.reset();
        streamSection.classList.add("d-none");
        classSelect.disabled = true;
        subjectSelect.disabled = true;
      } else {
        console.error("Quiz upload failed", result);
        showStatusModal(
          "Error",
          result.message || "Failed to create quiz",
          "error",
        );
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      showStatusModal("Error", "An unexpected error occurred", "error");
    } finally {
      submitBtn.disabled = false;
      spinner.classList.add("d-none");
    }
  });

  function showStatusModal(title, message, type) {
    const modal = document.getElementById("statusModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalIcon = document.getElementById("modalIcon");

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (type === "success") {
      modalIcon.innerHTML = "✅";
      modalIcon.className = "mb-4 fs-1 text-success";
    } else {
      modalIcon.innerHTML = "❌";
      modalIcon.className = "mb-4 fs-1 text-danger";
    }

    modal.style.display = "block";
    // close button handler
    const closeBtn = document.getElementById("statusCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = "none";
      };
    }
  }

  // Logout handler
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  // back button
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "admin-dashboard.html";
    });
  }

  // hide modal when clicking outside content
  window.addEventListener("click", (e) => {
    const mod = document.getElementById("statusModal");
    if (e.target === mod) {
      mod.style.display = "none";
    }
  });
});
