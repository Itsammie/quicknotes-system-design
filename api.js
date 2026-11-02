// QuickNotes API client (practice API: JSONPlaceholder)
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE = 100;

const loadBtn = document.getElementById("load-btn");
const form = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const list = document.getElementById("notes-list");

/* ---------- UI helpers ---------- */

function setStatus(message, type) {
  statusEl.textContent = message;          // textContent only
  statusEl.className = type || "";         // loading | success | error
}

// Disable every button while a request is running.
function setBusy(busy) {
  loadBtn.disabled = busy;
  submitBtn.disabled = busy;
  document.querySelectorAll(".delete-btn").forEach((b) => (b.disabled = busy));
}

function showEmptyState() {
  list.textContent = "";
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = "No notes yet. Load notes or add one above.";
  list.appendChild(li);
}

function removeEmptyState() {
  const empty = list.querySelector("li.empty");
  if (empty) empty.remove();
}

function createNoteElement(note, isLocal) {
  const li = document.createElement("li");
  li.dataset.id = note.id;
  li.dataset.local = isLocal ? "true" : "false";

  const h3 = document.createElement("h3");
  h3.className = "note-title";
  h3.textContent = note.title;

  const p = document.createElement("p");
  p.className = "note-body";
  p.textContent = note.body || "";

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete-btn";
  del.textContent = "Delete";
  del.addEventListener("click", () => deleteNote(note.id, li));

  li.append(h3, p, del);
  return li;
}

/* ---------- Reusable request function ---------- */

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const text = await response.text();                 // DELETE may return an empty/{} body
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data };
}

/* ---------- GET ---------- */

async function loadNotes() {
  setBusy(true);
  setStatus("Loading notes...", "loading");
  try {
    const { data } = await request(`${API_URL}?_limit=10`);
    list.textContent = "";
    if (!Array.isArray(data) || data.length === 0) {
      showEmptyState();
      setStatus("The server returned no notes.", "success");
      return;
    }
    data.forEach((note) => list.appendChild(createNoteElement(note, false)));
    setStatus(`Loaded ${data.length} notes from the server.`, "success");
  } catch (error) {
    console.error(error);
    setStatus("Sorry, we could not load your notes. Please check your connection and try again.", "error");
  } finally {
    setBusy(false);
  }
}

/* ---------- POST ---------- */

function validateTitle(title) {
  if (!title) return "Please enter a title.";
  if (title.length > MAX_TITLE) return `Title must be ${MAX_TITLE} characters or fewer.`;
  return "";
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  const problem = validateTitle(title);
  if (problem) {
    setStatus(problem, "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  setStatus("Saving note...", "loading");
  try {
    const { status, data } = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    removeEmptyState();
    list.prepend(createNoteElement({ id: data.id, title: data.title, body: data.body }, true));
    setStatus(`Note created (status ${status}, id ${data.id}).`, "success");
    form.reset();
  } catch (error) {
    console.error(error);
    setStatus("Sorry, we could not save your note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

/* ---------- DELETE ---------- */

/*
 * JSONPlaceholder is a fake API: it never really stores what we POST.
 * A note we created here gets id 101, but the server has no record of it,
 * so DELETE /posts/101 would be meaningless (or return a misleading result).
 * Approach: notes created in this session ("local") are removed from the page
 * only; notes loaded from the server get a real DELETE request, and we remove
 * them from the page only after the server answers with success.
 * With a real backend, every note would go through DELETE.
 */
async function deleteNote(id, li) {
  if (li.dataset.local === "true") {
    li.remove();
    if (!list.children.length) showEmptyState();
    setStatus("Note removed (it only existed in this browser session).", "success");
    return;
  }

  setBusy(true);
  setStatus("Deleting note...", "loading");
  try {
    const { status } = await request(`${API_URL}/${id}`, { method: "DELETE" });
    li.remove();
    if (!list.children.length) showEmptyState();
    setStatus(`Note ${id} deleted (status ${status}).`, "success");
  } catch (error) {
    console.error(error);
    setStatus("Sorry, we could not delete that note. Please try again.", "error");
  } finally {
    setBusy(false);
  }
}

/* ---------- Wire up ---------- */

loadBtn.addEventListener("click", loadNotes);
form.addEventListener("submit", createNote);
showEmptyState();