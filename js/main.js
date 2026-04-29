"use strict";

/* ═══════════════════════════════════════════
   Nota — Notes App  |  main.js
═══════════════════════════════════════════ */

// ── State ──────────────────────────────────
let notes         = JSON.parse(localStorage.getItem("nota-notes") || "[]");
let currentFilter = "all";
let currentSort   = "newest";   // newest | oldest | alpha
let isListView    = false;
let editingId     = null;
let isPinned      = false;
let deferredPrompt= null;

// ── DOM refs ───────────────────────────────
const $  = id => document.getElementById(id);
const notesGrid      = $("notesGrid");
const emptyState     = $("emptyState");
const searchInput    = $("searchInput");
const fabBtn         = $("fabBtn");
const modalBackdrop  = $("modalBackdrop");
const noteModal      = $("noteModal");
const noteTitle      = $("noteTitle");
const noteEditor     = $("noteEditor");
const noteCategory   = $("noteCategory");
const pinToggle      = $("pinToggle");
const deleteNoteBtn  = $("deleteNoteBtn");
const saveBtn        = $("saveBtn");
const cancelBtn      = $("cancelBtn");
const viewToggle     = $("viewToggle");
const sortBtn        = $("sortBtn");
const wordCountLive  = $("wordCountLive");
const noteTimestamp  = $("noteTimestamp");
const toast          = $("toast");
const sidebar        = $("sidebar");
const menuBtn        = $("menuBtn");
const sidebarClose   = $("sidebarClose");
const overlay        = $("overlay");
const topbarTitle    = $("topbarTitle");
const focusModeBtn   = $("focusModeBtn");
const installBadge   = $("installBadge");
const installBtn     = $("installBtn");
const offlineBadge   = $("offlineBadge");
const countAll       = $("countAll");
const countPinned    = $("countPinned");
const countWork      = $("countWork");
const countPersonal  = $("countPersonal");
const countIdeas     = $("countIdeas");
const statNotes      = $("statNotes");
const statWords      = $("statWords");

// ── Helpers ────────────────────────────────
const save = () => localStorage.setItem("nota-notes", JSON.stringify(notes));
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

function wordCount(html) {
  const t = html.replace(/<[^>]+>/g, " ").trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function relativeTime(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s <    60) return "Just now";
  if (s <  3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800)return `${Math.floor(s/86400)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

let toastTimer;
function showToast(msg, bg = "") {
  clearTimeout(toastTimer);
  toast.textContent    = msg;
  toast.style.background = bg || "";
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

// ── Data helpers ───────────────────────────
function getFiltered() {
  let list = [...notes];

  const q = searchInput.value.trim().toLowerCase();
  if (q) list = list.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.content.replace(/<[^>]+>/g,"").toLowerCase().includes(q)
  );

  if (currentFilter === "pinned")   list = list.filter(n => n.pinned);
  if (currentFilter === "work")     list = list.filter(n => n.category === "work");
  if (currentFilter === "personal") list = list.filter(n => n.category === "personal");
  if (currentFilter === "ideas")    list = list.filter(n => n.category === "ideas");

  if (currentSort === "newest") list.sort((a,b) => b.updatedAt - a.updatedAt);
  if (currentSort === "oldest") list.sort((a,b) => a.createdAt - b.createdAt);
  if (currentSort === "alpha")  list.sort((a,b) => a.title.localeCompare(b.title));

  // Pinned always float to top
  list.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0));
  return list;
}

// ── Render ─────────────────────────────────
const catLabel = { work:"Work", personal:"Personal", ideas:"Ideas" };

function renderNotes() {
  const list = getFiltered();
  notesGrid.innerHTML = "";
  emptyState.style.display = list.length ? "none" : "block";

  list.forEach((note, i) => {
    const card = document.createElement("div");
    card.className = `note-card${note.pinned ? " pinned" : ""}`;
    card.dataset.id       = note.id;
    card.dataset.category = note.category;
    card.style.animationDelay = `${i * 0.038}s`;

    const preview = note.content.replace(/<[^>]+>/g," ").trim().slice(0,200);
    const wc      = wordCount(note.content);

    card.innerHTML = `
      <div class="pin-badge">◆ Pinned</div>
      <span class="card-category cat-${note.category}">${catLabel[note.category]}</span>
      <div class="card-title">${note.title || "Untitled"}</div>
      <div class="card-preview">${preview || "No content yet."}</div>
      <div class="card-footer">
        <span class="card-date">${relativeTime(note.updatedAt)}</span>
        <span class="card-wc">${wc} ${wc === 1 ? "word" : "words"}</span>
      </div>`;

    card.addEventListener("click", () => openModal(note.id));
    notesGrid.appendChild(card);
  });

  updateCounts();
}

function updateCounts() {
  const total = notes.length;
  const pinned   = notes.filter(n => n.pinned).length;
  const work     = notes.filter(n => n.category === "work").length;
  const personal = notes.filter(n => n.category === "personal").length;
  const ideas    = notes.filter(n => n.category === "ideas").length;
  const allWords = notes.reduce((s,n) => s + wordCount(n.content), 0);

  countAll.textContent      = total;
  countPinned.textContent   = pinned;
  countWork.textContent     = work;
  countPersonal.textContent = personal;
  countIdeas.textContent    = ideas;
  statNotes.textContent     = total;
  statWords.textContent     = allWords > 999 ? (allWords/1000).toFixed(1)+"k" : allWords;
}

// ── Modal ──────────────────────────────────
function openModal(id = null) {
  editingId = id;
  isPinned  = false;

  if (id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    noteTitle.value      = note.title;
    noteEditor.innerHTML = note.content;
    noteCategory.value   = note.category;
    isPinned             = note.pinned;
    noteTimestamp.textContent = relativeTime(note.updatedAt);
    deleteNoteBtn.style.display = "inline-flex";
  } else {
    noteTitle.value      = "";
    noteEditor.innerHTML = "";
    noteCategory.value   = "personal";
    noteTimestamp.textContent = "Just now";
    deleteNoteBtn.style.display = "none";
  }

  pinToggle.classList.toggle("is-pinned", isPinned);
  liveWordCount();
  modalBackdrop.classList.add("open");
  setTimeout(() => noteTitle.focus(), 70);
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  noteModal.classList.remove("is-focus");
  focusModeBtn.classList.remove("active");
  editingId = null;
}

function saveNote() {
  const title    = noteTitle.value.trim();
  const content  = noteEditor.innerHTML.trim();
  const category = noteCategory.value;

  if (!title && !content) {
    showToast("Note is empty!", "var(--danger)");
    noteTitle.focus();
    return;
  }

  const now = Date.now();
  if (editingId) {
    const idx = notes.findIndex(n => n.id === editingId);
    if (idx > -1) notes[idx] = { ...notes[idx], title, content, category, pinned: isPinned, updatedAt: now };
    showToast("✓ Note updated");
  } else {
    notes.unshift({ id: uid(), title, content, category, pinned: isPinned, createdAt: now, updatedAt: now });
    showToast("✓ Note saved", "var(--primary)");
  }

  save();
  renderNotes();
  closeModal();
}

function deleteNote() {
  if (!editingId) return;
  if (!confirm("Delete this note permanently?")) return;
  notes = notes.filter(n => n.id !== editingId);
  save();
  renderNotes();
  closeModal();
  showToast("🗑 Note deleted", "#ef4444");
}

function liveWordCount() {
  const wc = wordCount(noteEditor.innerHTML);
  wordCountLive.textContent = `${wc} ${wc === 1 ? "word" : "words"}`;
}

// ── Toolbar ────────────────────────────────
document.querySelectorAll(".toolbar-btn[data-cmd]").forEach(btn => {
  btn.addEventListener("mousedown", e => {
    e.preventDefault();
    document.execCommand(btn.dataset.cmd, false, null);
    noteEditor.focus();
  });
});

// ── Events ─────────────────────────────────
fabBtn.addEventListener("click", () => openModal());
saveBtn.addEventListener("click", saveNote);
cancelBtn.addEventListener("click", closeModal);
deleteNoteBtn.addEventListener("click", deleteNote);
noteEditor.addEventListener("input", liveWordCount);
searchInput.addEventListener("input", renderNotes);

pinToggle.addEventListener("click", () => {
  isPinned = !isPinned;
  pinToggle.classList.toggle("is-pinned", isPinned);
  showToast(isPinned ? "◆ Note pinned" : "Pin removed");
});

modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeModal(); });

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNote(); }
  if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); openModal(); }
});

// Filter nav
const filterTitles = { all:"All Notes", pinned:"Pinned", work:"Work", personal:"Personal", ideas:"Ideas" };
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentFilter = item.dataset.filter;
    topbarTitle.textContent = filterTitles[currentFilter] || "Notes";
    renderNotes();
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// View toggle
viewToggle.addEventListener("click", () => {
  isListView = !isListView;
  notesGrid.classList.toggle("list-view", isListView);
  viewToggle.textContent = isListView ? "⊟" : "⊞";
});

// Sort cycle
const sortCycle  = ["newest","oldest","alpha"];
const sortToasts = { newest:"Newest first", oldest:"Oldest first", alpha:"Alphabetical" };
const sortIcons  = { newest:"⇅", oldest:"⇅", alpha:"A→" };
sortBtn.addEventListener("click", () => {
  const i  = sortCycle.indexOf(currentSort);
  currentSort = sortCycle[(i+1) % sortCycle.length];
  sortBtn.textContent = sortIcons[currentSort];
  showToast(sortToasts[currentSort]);
  renderNotes();
});

// Focus mode
focusModeBtn.addEventListener("click", () => {
  noteModal.classList.toggle("is-focus");
  focusModeBtn.classList.toggle("active");
});

// Sidebar
const openSidebar  = () => { sidebar.classList.add("open");  overlay.classList.add("active"); };
const closeSidebar = () => { sidebar.classList.remove("open"); overlay.classList.remove("active"); };
menuBtn.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// ── PWA ────────────────────────────────────
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  installBadge.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") {
    installBadge.style.display = "none";
    showToast("✓ App installed!", "var(--success)");
  }
  deferredPrompt = null;
});

window.addEventListener("online",  () => { offlineBadge.style.display = "none";  showToast("● Back online",  "var(--success)"); });
window.addEventListener("offline", () => { offlineBadge.style.display = "block"; showToast("● You're offline — notes still saved", "var(--accent)"); });

// ── Seed data (first run) ──────────────────
if (!notes.length) {
  const now = Date.now();
  notes = [
    {
      id: uid(), title: "Welcome to Nota ✦",
      content: "<p>This is your personal notes space — clean, fast, and offline-ready.</p><p>Use <b>+</b> to create a note, or try the keyboard shortcut <b>Ctrl + N</b>.</p><p>Everything is saved <b>locally</b> in your browser — no account needed.</p>",
      category: "personal", pinned: true, createdAt: now, updatedAt: now
    },
    {
      id: uid(), title: "Project ideas backlog",
      content: "<ul><li>Redesign the onboarding flow</li><li>Add keyboard shortcuts guide</li><li>Explore dark mode palette</li><li>Write API documentation</li></ul>",
      category: "ideas", pinned: false, createdAt: now - 3600000, updatedAt: now - 3600000
    },
    {
      id: uid(), title: "This week's priorities",
      content: "<p>Sync with the team on the Q3 roadmap before Thursday.</p><p>Send the client proposal by EOD Wednesday and follow up Friday morning.</p>",
      category: "work", pinned: false, createdAt: now - 86400000, updatedAt: now - 43200000
    }
  ];
  save();
}

// ── Init ────────────────────────────────────
renderNotes();
