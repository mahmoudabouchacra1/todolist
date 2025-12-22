const elms = {
  taskName: document.getElementById("taskName"),
  taskInput: document.getElementById("taskInput"),
  addTaskButton: document.getElementById("addTaskButton"),
  taskBody: document.getElementById("taskBody"),
  searchInput: document.getElementById("searchInput"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  pageInfo: document.getElementById("pageInfo"),
};

const STORAGE_KEY = "todo_tasks";

let tasks = loadTasks();
let nextId = loadNextId();
let page = 1;
const tasksPerPage = 5;
let searchTerm = "";

function getTime() {
  return new Date().toLocaleString();
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

  elms.pageInfo.textContent = `Page ${page} / ${totalPages}`;
  elms.prevPageBtn.disabled = page === 1;
  elms.nextPageBtn.disabled = page === totalPages;
}


function renderAll() {
  elms.taskBody.innerHTML = "";

  const filtered = getFilteredTasks();
  clampPage();

  const start = (page - 1) * tasksPerPage;
  const visible = filtered.slice(start, start + tasksPerPage);

  for (const task of visible) {
    elms.taskBody.appendChild(createRow(task));
  }

  updatePaginationUI(filtered.length);
}

function createRow(task) {
  const row = document.createElement("tr");
  row.dataset.id = task.id;

  const tdName = document.createElement("td");
  tdName.textContent = task.title;

  const tdDesc = document.createElement("td");
  tdDesc.textContent = task.description;

  const tdCreatedAt = document.createElement("td");
  tdCreatedAt.textContent = task.createdAt;

  const tdEditedAt = document.createElement("td");
  tdEditedAt.textContent = task.editedAt ? task.editedAt : "—";

  const tdActions = document.createElement("td");
  tdActions.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "edit";
  editBtn.type = "button";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.className = "save";
  saveBtn.type = "button";
  saveBtn.style.display = "none";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete";
  deleteBtn.type = "button";

  tdActions.append(editBtn, saveBtn, deleteBtn);
  row.append(tdName, tdDesc, tdCreatedAt, tdEditedAt, tdActions);

  editBtn.addEventListener("click", () => {
    elms.taskName.value = tdName.textContent;
    elms.taskInput.value = tdDesc.textContent;

    elms.taskInput.style.height = "auto";
    elms.taskInput.style.height = elms.taskInput.scrollHeight + "px";

    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
  });

  saveBtn.addEventListener("click", () => {
    const newTitle = elms.taskName.value.trim();
    const newDesc = elms.taskInput.value.trim();

    if (newTitle === "" || newDesc === "") {
      alert("please fill in both fields");
      return;
    }

    const editedTime = getTime();

    const id = Number(row.dataset.id);
    const t = tasks.find(x => x.id === id);
    if (t) {
      t.title = newTitle;
      t.description = newDesc;
      t.editedAt = editedTime;
      saveAll();
    }

    clearInputs();
    renderAll();
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

  if (name === "" || desc === "") {
    alert("please fill in both fields");
    return;
  }

  const task = {
    id: nextId++,
    title: name,
    description: desc,
    createdAt: getTime(),
    editedAt: null,
  };

  tasks.push(task);
  saveAll();

  clearInputs();

  
  const filteredAfterAdd = getFilteredTasks(); 
  page = getTotalPages(filteredAfterAdd.length);

  renderAll();
}

elms.addTaskButton.addEventListener("click", addtask);

elms.searchInput.addEventListener("input", () => {
  searchTerm = elms.searchInput.value;
  page = 1; 
  renderAll();
});

elms.prevPageBtn.addEventListener("click", () => {
  page--;
  renderAll();
});

elms.nextPageBtn.addEventListener("click", () => {
  page++;
  renderAll();
});
renderAll();
