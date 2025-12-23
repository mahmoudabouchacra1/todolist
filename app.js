"use strict";

const elms = {
  taskName: document.getElementById("taskName"),
  taskInput: document.getElementById("taskInput"),
  dueInput: document.getElementById("dueInput"),
  addTaskButton: document.getElementById("addTaskButton"),
  taskBody: document.getElementById("taskBody"),

  searchInput: document.getElementById("searchInput"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  pageInfo: document.getElementById("pageInfo"),

  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn"),
};

const STORAGE_KEY = "todo_tasks_v2_utc";

let tasks = loadTasks();
let nextId = loadNextId();
let page = 1;
const tasksPerPage = 5;
let searchTerm = "";


const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 50;

function cloneState() {
  return {
    tasks: JSON.parse(JSON.stringify(tasks)),
    nextId,
    page,
    searchTerm
  };
}

function restoreState(state) {
  tasks = JSON.parse(JSON.stringify(state.tasks));
  nextId = state.nextId;
  page = state.page;
  searchTerm = state.searchTerm;
  elms.searchInput.value = searchTerm;
}

function pushHistory() {
  undoStack.push(cloneState());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0; 
  updateHistoryUI();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(cloneState());
  const prev = undoStack.pop();
  restoreState(prev);
  saveAll();
  renderAll();
  updateHistoryUI();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(cloneState());
  const next = redoStack.pop();
  restoreState(next);
  saveAll();
  renderAll();
  updateHistoryUI();
}

function updateHistoryUI() {
  elms.undoBtn.disabled = undoStack.length === 0;
  elms.redoBtn.disabled = redoStack.length === 0;
}

elms.undoBtn.addEventListener("click", undo);
elms.redoBtn.addEventListener("click", redo);




function nowUtcIso() {
  return new Date().toISOString();
}

function formatLocal(isoOrNull) {
  if (!isoOrNull) return "—";
  const d = new Date(isoOrNull);
  return isNaN(d) ? "—" : d.toLocaleString();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateTimeLocalValue(utcIso) {
  const d = new Date(utcIso);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localValueToUtcIso(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  return isNaN(d) ? null : d.toISOString();
}


function saveAll() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEY + "_nextId", String(nextId));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function loadNextId() {
  const raw = localStorage.getItem(STORAGE_KEY + "_nextId");
  return raw ? Number(raw) : 1;
}


function clearInputs() {
  elms.taskName.value = "";
  elms.taskInput.value = "";
  elms.dueInput.value = "";
  elms.taskInput.style.height = "auto";
}

elms.taskInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});


function getFilteredTasks() {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(t => {
    return (
      (t.title || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
    );
  });
}

function getTotalPages(filteredCount) {
  return Math.max(1, Math.ceil(filteredCount / tasksPerPage));
}

function clampPage() {
  const filtered = getFilteredTasks();
  const totalPages = getTotalPages(filtered.length);
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
}

function updatePaginationUI(filteredCount) {
  const totalPages = getTotalPages(filteredCount);
  elms.pageInfo.textContent = filteredCount === 0 ? "No results" : `Page ${page} / ${totalPages}`;
  elms.prevPageBtn.disabled = (page === 1) || (filteredCount === 0);
  elms.nextPageBtn.disabled = (page === totalPages) || (filteredCount === 0);
}


let draggingId = null;

function reorderByIds(dragId, dropId) {
  const fromIdx = tasks.findIndex(t => t.id === dragId);
  const toIdx = tasks.findIndex(t => t.id === dropId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

  
  pushHistory();

  const [moved] = tasks.splice(fromIdx, 1);
  tasks.splice(toIdx, 0, moved);

  saveAll();
  renderAll();
}


function renderAll() {
  elms.taskBody.innerHTML = "";

  const filtered = getFilteredTasks();
  clampPage();

  if (filtered.length === 0) {
    updatePaginationUI(0);
    updateHistoryUI();
    return;
  }

  const start = (page - 1) * tasksPerPage;
  const visible = filtered.slice(start, start + tasksPerPage);

  for (const task of visible) {
    elms.taskBody.appendChild(createRow(task));
  }

  updatePaginationUI(filtered.length);
  updateHistoryUI();
}


const dlg = document.getElementById("editDialog");
const editForm = document.getElementById("editForm");
const editTitle = document.getElementById("editTitle");
const editDesc = document.getElementById("editDesc");
const editDue = document.getElementById("editDue");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let editingId = null;

cancelEditBtn.addEventListener("click", () => {
  editingId = null;
  dlg.close();
});

editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (editingId == null) return;

  const newTitle = editTitle.value.trim();
  const newDesc = editDesc.value.trim();
  if (!newTitle || !newDesc) {
    alert("please fill in title and description");
    return;
  }

  
  pushHistory();

  const dueAtUtc = localValueToUtcIso(editDue.value);

  const t = tasks.find(x => x.id === editingId);
  if (!t) return;

  t.title = newTitle;
  t.description = newDesc;
  t.dueAtUtc = dueAtUtc;
  t.editedAtUtc = nowUtcIso();

  saveAll();
  dlg.close();
  editingId = null;

  clearInputs();
  renderAll();
});


function createRow(task) {
  const row = document.createElement("tr");
  row.dataset.id = task.id;

  
  const dragEnabled = searchTerm.trim() === "";
  row.draggable = dragEnabled;

  
  row.addEventListener("dragstart", (e) => {
    if (!dragEnabled) return;
    draggingId = Number(row.dataset.id);
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  row.addEventListener("dragend", () => {
    row.classList.remove("dragging");
    draggingId = null;
  });

  row.addEventListener("dragover", (e) => {
    if (!dragEnabled) return;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  });

  row.addEventListener("drop", (e) => {
    if (!dragEnabled) return;
    e.preventDefault();
    const dropId = Number(row.dataset.id);
    if (draggingId == null) return;
    reorderByIds(draggingId, dropId);
  });

  
  const tdMove = document.createElement("td");
  const handle = document.createElement("span");
  handle.className = "dragHandle";
  handle.title = dragEnabled ? "Drag to reorder" : "Clear search to reorder";
  handle.textContent = "drag & drop";
  tdMove.appendChild(handle);

  const tdName = document.createElement("td");
  tdName.textContent = task.title;

  const tdDesc = document.createElement("td");
  const descDiv = document.createElement("div");
  descDiv.className = "desc";
  descDiv.textContent = task.description;
  tdDesc.appendChild(descDiv);

  const tdCreatedAt = document.createElement("td");
  tdCreatedAt.textContent = formatLocal(task.createdAtUtc);

  const tdEditedAt = document.createElement("td");
  tdEditedAt.textContent = formatLocal(task.editedAtUtc);

  const tdDue = document.createElement("td");
  tdDue.textContent = formatLocal(task.dueAtUtc);

  const tdActions = document.createElement("td");
  tdActions.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "edit";
  editBtn.type = "button";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete";
  deleteBtn.type = "button";

  tdActions.append(editBtn, deleteBtn);

  row.append(tdMove, tdName, tdDesc, tdCreatedAt, tdEditedAt, tdDue, tdActions);

  editBtn.addEventListener("click", () => {
    editingId = Number(row.dataset.id);
    const t = tasks.find(x => x.id === editingId);
    if (!t) return;

    editTitle.value = t.title || "";
    editDesc.value = t.description || "";
    editDue.value = t.dueAtUtc ? toDateTimeLocalValue(t.dueAtUtc) : "";

    dlg.showModal();
  });

  deleteBtn.addEventListener("click", () => {
    const id = Number(row.dataset.id);

    
    pushHistory();

    tasks = tasks.filter(x => x.id !== id);
    saveAll();
    renderAll();
  });

  return row;
}


function addtask() {
  const name = elms.taskName.value.trim();
  const desc = elms.taskInput.value.trim();
  const dueLocal = elms.dueInput.value;

  const nameErr = document.getElementById("nameError");
  const descErr = document.getElementById("descError");
  const dueErr = document.getElementById("dueError");

  let valid = true;

  if (name === "") {
    nameErr.style.visibility = "visible";
    elms.taskName.classList.add("invalid");
    valid = false;
  } else {
    nameErr.style.visibility = "hidden";
    elms.taskName.classList.remove("invalid");
  }

  if (desc === "") {
    descErr.style.visibility = "visible";
    elms.taskInput.classList.add("invalid");
    valid = false;
  } else {
    descErr.style.visibility = "hidden";
    elms.taskInput.classList.remove("invalid");
  }

  if (dueLocal === "") {
    dueErr.style.visibility = "visible";
    elms.dueInput.classList.add("invalid");
    valid = false;
  } else {
    dueErr.style.visibility = "hidden";
    elms.dueInput.classList.remove("invalid");
  }

  if (!valid) return;

 
  pushHistory();

  const task = {
    id: nextId++,
    title: name,
    description: desc,
    createdAtUtc: nowUtcIso(),
    editedAtUtc: null,
    dueAtUtc: localValueToUtcIso(dueLocal),
  };

  tasks.push(task);
  saveAll();
  clearInputs();

  const filteredAfterAdd = getFilteredTasks();
  page = getTotalPages(filteredAfterAdd.length);

  renderAll();
}

elms.addTaskButton.addEventListener("click", addtask);


function debounce(fn, delay = 2000) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

elms.searchInput.addEventListener(
  "input",
  debounce(() => {
    searchTerm = elms.searchInput.value;
    page = 1;
    renderAll();
  }, 2000)
);


elms.prevPageBtn.addEventListener("click", () => {
  page--;
  renderAll();
});

elms.nextPageBtn.addEventListener("click", () => {
  page++;
  renderAll();
});


(function migrateIfNeeded(){
  if (tasks.length > 0 && tasks[0].createdAtUtc) {
    updateHistoryUI();
    return;
  }

  tasks = tasks.map(t => {
    const createdGuess = t.createdAt ? new Date(t.createdAt) : new Date();
    const editedGuess = t.editedAt ? new Date(t.editedAt) : null;

    return {
      id: Number(t.id) || nextId++,
      title: t.title || "",
      description: t.description || "",
      createdAtUtc: isNaN(createdGuess) ? nowUtcIso() : createdGuess.toISOString(),
      editedAtUtc: editedGuess && !isNaN(editedGuess) ? editedGuess.toISOString() : null,
      dueAtUtc: null,
    };
  });

  const maxId = tasks.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  nextId = Math.max(nextId, maxId + 1);

  saveAll();
  updateHistoryUI();
})();

renderAll();
