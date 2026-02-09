// ============================================
// STUDENT NOTES SEARCH PAGE
// Students can search, filter and download notes only (no editing)
// ============================================

const SEARCH_API_BASE = "/api";
let searchNotesCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Ensure only logged-in users can access; primarily students
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    logout();
    return;
  }

  const nameNav = document.getElementById("studentNameNav");
  if (nameNav) nameNav.textContent = user.name;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => logout());
  }

  const searchInput = document.getElementById("searchInput");
  const levelFilter = document.getElementById("levelFilter");
  const classFilter = document.getElementById("classFilter");

  // Default filters to the student's level/class if available
  if (user.level && levelFilter) levelFilter.value = user.level;
  if (user.class && classFilter) classFilter.value = user.class;

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce((e) => applyFilters(), 300),
    );
  }
  if (levelFilter) {
    levelFilter.addEventListener("change", applyFilters);
  }
  if (classFilter) {
    classFilter.addEventListener("change", applyFilters);
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("download-note-btn")) {
      const noteId = e.target.getAttribute("data-note-id");
      const noteTitle = e.target.getAttribute("data-note-title");
      downloadSearchNote(noteId, noteTitle);
    }
  });

  await loadAllNotes(user);
});

async function loadAllNotes(user) {
  const container = document.getElementById("notesContainer");
  if (!container) return;

  showLoading(container);

  try {
    const params = new URLSearchParams();

    // Start by limiting to the student's own level/class, they can widen using filters
    if (user.level) params.append("level", user.level);
    if (user.class) params.append("class", user.class);

    let url = `${SEARCH_API_BASE}/notes`;
    const query = params.toString();
    if (query) url += "?" + query;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load notes");
    }

    const data = await res.json();
    searchNotesCache = data.data || [];

    renderSearchNotes(searchNotesCache);
  } catch (err) {
    console.error("Failed to load notes", err);
    showErrorMessage(
      "Could not load notes. Please try again later.",
      container,
    );
  }
}

function applyFilters() {
  const q = (document.getElementById("searchInput")?.value || "")
    .trim()
    .toLowerCase();
  const level = document.getElementById("levelFilter")?.value || "";
  const classLevel = document.getElementById("classFilter")?.value || "";

  let filtered = [...searchNotesCache];

  if (level) {
    filtered = filtered.filter((n) => n.level === level);
  }
  if (classLevel) {
    filtered = filtered.filter((n) => n.class === classLevel);
  }

  if (q) {
    filtered = filtered.filter((note) => {
      return (
        (note.title && note.title.toLowerCase().includes(q)) ||
        (note.subject && note.subject.toLowerCase().includes(q)) ||
        (note.description &&
          note.description.toLowerCase().includes(q))
      );
    });
  }

  renderSearchNotes(filtered);
}

function renderSearchNotes(notes) {
  const container = document.getElementById("notesContainer");
  if (!container) return;

  if (!notes.length) {
    container.innerHTML =
      '<div class="no-data">No notes found for the selected filters.</div>';
    return;
  }

  container.innerHTML = notes
    .map(
      (note) => `
      <article class="note-card">
        <div class="note-header">
          <h3>${note.title}</h3>
          <span class="note-badge">${note.subject}</span>
        </div>
        <p class="note-description">
          ${note.description || "No description provided."}
        </p>
        <div class="note-meta">
          <span>Level: ${note.level}</span>
          <span>Class: ${note.class.toUpperCase()}</span>
          ${
            note.combination
              ? `<span>Combination: ${note.combination}</span>`
              : ""
          }
          <span>Uploaded: ${formatDate(note.createdAt)}</span>
        </div>
        <div class="note-actions">
          <button
            class="btn-sm btn-primary download-note-btn"
            data-note-id="${note.id}"
            data-note-title="${note.title.replace(/"/g, "&quot;")}"
          >
            Download
          </button>
        </div>
      </article>
    `,
    )
    .join("");
}

async function downloadSearchNote(id, title) {
  try {
    const res = await fetch(`${SEARCH_API_BASE}/notes/${id}/download`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to download note");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title || "note").replace(/[^\w\-.]+/g, "_");
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed", err);
    alert(err.message || "Failed to download note");
  }
}


