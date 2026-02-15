// ============================================
// ADMIN NOTE UPLOAD PAGE
// Reuses the same API as admin dashboard, but in a dedicated form page
// ============================================

const UPLOAD_API_BASE = "/api";
let currentSubjects = [];

const combinationsByStream = {
  sciences: {
    PCM: "Physics, Chemistry, Math",
    PCB: "Physics, Chemistry, Biology",
    BCG: "Biology, Chemistry, Geography",
    MPG: "Math, Physics, Geography",
    BCM: "Biology, Chemistry, Math",
  },
  arts: {
    HEG: "History, Economics, Geography",
    HEL: "History, Economics, Literature",
    MEG: "Math, Economics, Geography",
    DEG: "Divinity, Economics, Geography",
    HGL: "History, Geography, Literature",
    AKR: "Art, Kiswahili, RE",
  },
};

document.addEventListener("DOMContentLoaded", async () => {
  // Ensure only admins can access this page
  if (typeof getCurrentUser === "function") {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      logout();
      return;
    }
    const adminNameEl = document.getElementById("adminName");
    if (adminNameEl) adminNameEl.textContent = user.name;
  }

  const levelSelect = document.getElementById("level");
  const classSelect = document.getElementById("class");
  const streamDiv = document.getElementById("streamDiv"); // New container
  const streamSelect = document.getElementById("stream"); // New select
  const combinationDiv = document.getElementById("combinationDiv"); // Renamed container
  const combinationSelect = document.getElementById("combination"); // Changed to select

  const uploadForm = document.getElementById("uploadForm");
  const backBtn = document.getElementById("backBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn && typeof logout === "function") {
    logoutBtn.addEventListener("click", () => logout());
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/pages/admin-dashboard.html";
    });
  }

  if (levelSelect && classSelect) {
    levelSelect.addEventListener("change", () => {
      const level = levelSelect.value;
      classSelect.innerHTML = '<option value="">Select class</option>';

      // Reset Stream/Combination on level change
      if (streamDiv) streamDiv.style.display = "none";
      if (combinationDiv) combinationDiv.style.display = "none";
      if (streamSelect) streamSelect.value = "";
      if (combinationSelect)
        combinationSelect.innerHTML =
          '<option value="">Select Stream First</option>';

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
        if (streamDiv) streamDiv.style.display = "block";
      }
    });
  }

  // Effect: When Class changes, fetch subjects
  if (classSelect) {
    classSelect.addEventListener("change", () => {
      const level = levelSelect.value;
      const classVal = classSelect.value;
      if (level && classVal) {
        loadSubjects(level, classVal);
      } else {
        document.getElementById("subject").innerHTML =
          '<option value="">Select Class First</option>';
      }
    });
  }

  if (streamSelect) {
    streamSelect.addEventListener("change", () => {
      const stream = streamSelect.value;
      if (combinationDiv) {
        if (stream && combinationsByStream[stream]) {
          combinationDiv.style.display = "block";
          const combos = combinationsByStream[stream];
          combinationSelect.innerHTML =
            '<option value="">Select Combination</option>' +
            Object.entries(combos)
              .map(
                ([code, name]) =>
                  `<option value="${code}">${code} (${name})</option>`,
              )
              .join("");
        } else {
          combinationDiv.style.display = "none";
          combinationSelect.innerHTML =
            '<option value="">Select Stream First</option>';
        }
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUploadSubmit);
  }
});

async function handleUploadSubmit(e) {
  e.preventDefault();

  const messageEl = document.getElementById("uploadMessage");
  if (messageEl) messageEl.innerHTML = "";

  const form = e.target;
  const formData = new FormData(form);

  if (!formData.get("file")) {
    if (messageEl) {
      messageEl.innerHTML =
        '<div class="error-message">Please select a file to upload.</div>';
    }
    return;
  }

  try {
    const res = await fetch(`${UPLOAD_API_BASE}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to upload note");
    }

    if (messageEl) {
      messageEl.innerHTML =
        '<div class="success-message">Note uploaded successfully.</div>';
    }
    form.reset();
  } catch (err) {
    console.error("Upload failed", err);
    if (messageEl) {
      messageEl.innerHTML = `<div class="error-message">${
        err.message || "Failed to upload note"
      }</div>`;
    }
  }
}

async function loadSubjects(level, classVal) {
  const subjectSelect = document.getElementById("subject");
  if (!subjectSelect) return;

  subjectSelect.innerHTML = '<option value="">Loading...</option>';

  try {
    // Construct query parameters
    const params = new URLSearchParams({
      level,
      class: classVal,
    });

    const res = await fetch(
      `${UPLOAD_API_BASE}/subjects?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );

    if (!res.ok) throw new Error("Failed to load subjects");

    const data = await res.json();
    currentSubjects = data.data || [];

    if (currentSubjects.length === 0) {
      subjectSelect.innerHTML =
        '<option value="">No subjects found for this class</option>';
      return;
    }

    subjectSelect.innerHTML =
      '<option value="">Select Subject</option>' +
      currentSubjects
        .map((s) => `<option value="${s.name}">${s.name}</option>`)
        .join("");
  } catch (err) {
    console.error("Error loading subjects:", err);
    subjectSelect.innerHTML =
      '<option value="">Error loading subjects</option>';
  }
}
