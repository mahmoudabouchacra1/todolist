const elms = {
  taskName: document.getElementById("taskName"),
  taskInput: document.getElementById("taskInput"),
  addTaskButton: document.getElementById("addTaskButton"),
  taskBody: document.getElementById("taskBody"),
};

const STORAGE_KEY = "todo_tasks";

let tasks = loadTasks();
let nextId = loadNextId();

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

    tdName.textContent = newTitle;
    tdDesc.textContent = newDesc;

    const editedTime = getTime();
    tdEditedAt.textContent = editedTime;

    const id = Number(row.dataset.id);
    const t = tasks.find(x => x.id === id);
    if (t) {
      t.title = newTitle;
      t.description = newDesc;
      t.editedAt = editedTime;
      saveAll();
    }

    saveBtn.style.display = "none";
    editBtn.style.display = "inline-block";
    clearInputs();
  });

  deleteBtn.addEventListener("click", () => {
    const id = Number(row.dataset.id);
    tasks = tasks.filter(x => x.id !== id);
    saveAll();
    row.remove();
  });

  return row;
}

function renderAll() {
  elms.taskBody.innerHTML = "";
  for (const task of tasks) {
    elms.taskBody.appendChild(createRow(task));
  }
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

  elms.taskBody.appendChild(createRow(task));
  clearInputs();
}

elms.addTaskButton.addEventListener("click", addtask);

renderAll();
