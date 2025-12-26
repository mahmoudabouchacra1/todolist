import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  
  const dlgRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDue, setEditDue] = useState("");

  const addTask = () => {
    if (!taskName || !taskDesc || !dueDate) {
      alert("All fields are required");
      return;
    }

    const now = new Date().toLocaleString();

    const newTask = {
      id: Date.now(),
      title: taskName.trim(),
      desc: taskDesc.trim(),
      due: dueDate,
      createdAt: now,
      editedAt: null,
    };

    setTasks((prev) => [...prev, newTask]);

    setTaskName("");
    setTaskDesc("");
    setDueDate("");
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) closeDialog();
  };

  const openDialog = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.desc);
    setEditDue(task.due);

    dlgRef.current?.showModal();
  };

  const closeDialog = () => {
    setEditingId(null);
    dlgRef.current?.close();
  };

  const saveEdit = (e) => {
    e.preventDefault();

    if (!editTitle || !editDesc || !editDue) {
      alert("All fields are required");
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: editTitle.trim(),
              desc: editDesc.trim(),
              due: editDue,
              editedAt: new Date().toLocaleString(),
            }
          : t
      )
    );

    closeDialog();
  };

  return (
    <div>
      <header>
        <h1>My To-Do List</h1>

        <div className="formRow">
          <div className="field">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Task title..."
            />
          </div>

          <div className="field">
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Task description..."
            />
          </div>

          <div className="field">
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <button type="button" onClick={addTask}>
            Add Task
          </button>
        </div>
      </header>

      <table>
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Description</th>
            <th>Due Date</th>
            <th>Created At</th>
            <th>Edited At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="6">No tasks yet</td>
            </tr>
          ) : (
            tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.desc}</td>
                <td>{t.due}</td>
                <td>{t.createdAt}</td>
                <td>{t.editedAt ?? "—"}</td>
                <td className="actionsCell">
                  <button type="button" onClick={() => openDialog(t)}>
                    Edit
                  </button>
                  <button type="button" onClick={() =>
                    window.confirm("Delete this task?") && deleteTask(t.id)
                  }>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    
      <dialog ref={dlgRef} className="editDialog" onCancel={closeDialog}>
        <h2>Edit Task</h2>

        <form onSubmit={saveEdit} className="dialogForm">
          <label>
            Title
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </label>

          <label>
            Description
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
            />
          </label>

          <label>
            Due Date
            <input
              type="datetime-local"
              value={editDue}
              onChange={(e) => setEditDue(e.target.value)}
            />
          </label>

          <div className="dialogBtns">
            <button type="button" onClick={closeDialog}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default App;
