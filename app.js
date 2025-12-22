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
};

const STORAGE_KEY = "todo_tasks_v2_utc";

let tasks = loadTasks();
let nextId = loadNextId();
let page = 1;
const tasksPerPage = 5;
let searchTerm = "";


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

function renderAll() {
  elms.taskBody.innerHTML = "";

  const filtered = getFilteredTasks();
  clampPage();

  if (filtered.length === 0) {
    updatePaginationUI(0);
    return;
  }

  const start = (page - 1) * tasksPerPage;
  const visible = filtered.slice(start, start + tasksPerPage);

  for (const task of visible) {
    elms.taskBody.appendChild(createRow(task));
  }

  updatePaginationUI(filtered.length);
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
  row.append(tdName, tdDesc, tdCreatedAt, tdEditedAt, tdDue, tdActions);

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


function debounce(fn, delay = 300) {
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
  }, 300)
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
  
  if (tasks.length > 0 && tasks[0].createdAtUtc) return;

  
  tasks = tasks.map(t => {
    if (t.createdAtUtc) return t;

    const createdGuess = t.createdAt ? new Date(t.createdAt) : new Date();
    const editedGuess = t.editedAt ? new Date(t.editedAt) : null;

    return {
      id: Number(t.id) || nextId++,
      title: t.title || t.taskName || "",
      description: t.description || t.taskInput || "",
      createdAtUtc: isNaN(createdGuess) ? nowUtcIso() : createdGuess.toISOString(),
      editedAtUtc: editedGuess && !isNaN(editedGuess) ? editedGuess.toISOString() : null,
      dueAtUtc: null,
    };
  });

  
  const maxId = tasks.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  nextId = Math.max(nextId, maxId + 1);

  saveAll();
})();

renderAll();
