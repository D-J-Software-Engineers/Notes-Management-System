// ============================================
// ADMIN NOTE UPLOAD PAGE
// Reuses the same API as admin dashboard, but in a dedicated form page
// ============================================

const UPLOAD_API_BASE = "/api";
let currentSubjects = [];

const combinationsByStream = {
  science: {
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

      // clear subject list while level is changing
      const subjectSelect = document.getElementById("subject");
      if (subjectSelect) {
        subjectSelect.innerHTML =
          '<option value="">Select Class First</option>';
        subjectSelect.disabled = true;
      }

      // Reset Stream/Combination on level change
      if (streamDiv) streamDiv.style.display = "none";
      if (combinationDiv) combinationDiv.style.display = "none";
      if (streamSelect) {
        streamSelect.value = "";
        streamSelect.innerHTML = "";
      }
      if (combinationSelect)
        combinationSelect.innerHTML =
          '<option value="">Select Stream First</option>';

      // update class options and stream UI depending on level
      if (level === "o-level") {
        classSelect.innerHTML += `
          <option value="s1">S1</option>
          <option value="s2">S2</option>
          <option value="s3">S3</option>
          <option value="s4">S4</option>
        `;
        if (streamDiv) {
          streamDiv.style.display = "block";
          // label for O-level stream
          const lbl = streamDiv.querySelector("label");
          if (lbl) lbl.textContent = "Stream (O-Level)";
          // options will be populated when class is chosen via loadClassStreams
          streamSelect.innerHTML =
            '<option value="">Loading streams...</option>';
        }
      } else if (level === "a-level") {
        classSelect.innerHTML += `
          <option value="s5">S5</option>
          <option value="s6">S6</option>
        `;
        if (streamDiv) {
          streamDiv.style.display = "block";
          const lbl = streamDiv.querySelector("label");
          if (lbl) lbl.textContent = "Academic Stream";
          // static arts/sciences options
          streamSelect.innerHTML =
            '<option value="">Select Stream</option>' +
            '<option value="arts">Arts</option>' +
            '<option value="science">Science</option>';
        }
      }
    });
  }

  // Effect: When Class changes, fetch subjects and streams (if needed)
  if (classSelect) {
    classSelect.addEventListener("change", () => {
      const level = levelSelect.value;
      const classVal = classSelect.value;
      if (level && classVal) {
        loadSubjects(level, classVal);
        if (level === "o-level") {
          loadClassStreams(classVal);
        }
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

  // append stream or classStream depending on level
  const lvl = document.getElementById("level").value;
  const streamVal = document.getElementById("stream").value;
  const comboVal = document.getElementById("combination")?.value;
  if (lvl === "o-level") {
    if (streamVal) formData.append("classStream", streamVal);
  } else if (lvl === "a-level") {
    if (streamVal) formData.append("stream", streamVal);
    if (comboVal) formData.append("combination", comboVal);
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

  const previous = subjectSelect.value;
  subjectSelect.innerHTML = '<option value="">Loading...</option>';

  try {
    // Construct query parameters
    const params = new URLSearchParams({
      level,
      class: classVal,
    });
    if (level === "a-level") {
      const streamVal = document.getElementById("stream")?.value;
      if (streamVal) params.append("stream", streamVal);
    }

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
      subjectSelect.disabled = true;
      return;
    }

    subjectSelect.innerHTML =
      '<option value="">Select Subject</option>' +
      currentSubjects
        .map((s) => `<option value="${s.name}">${s.name}</option>`)
        .join("");
    // try to restore previous value if it still exists
    if (previous) subjectSelect.value = previous;
    subjectSelect.disabled = false;
  } catch (err) {
    console.error("Error loading subjects:", err);
    subjectSelect.innerHTML =
      '<option value="">Error loading subjects</option>';
  }
}

async function loadClassStreams(classVal) {
  if (!streamSelect) return;
  streamSelect.innerHTML = '<option value="">Loading streams...</option>';
  try {
    const res = await fetch(`/api/streams?class=${classVal}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    const streams = data.data || [];
    if (streams.length === 0) {
      streamSelect.innerHTML = '<option value="">No streams defined</option>';
    } else {
      streamSelect.innerHTML =
        '<option value="">Select Stream</option>' +
        streams
          .map((s) => `<option value="${s.name}">${s.name}</option>`)
          .join("");
    }
  } catch (err) {
    console.error("Error loading class streams:", err);
    streamSelect.innerHTML = '<option value="">Error loading streams</option>';
  }
}
