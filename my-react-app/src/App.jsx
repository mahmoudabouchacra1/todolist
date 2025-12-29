import { useEffect, useState } from "react";
import "./App.css";
import TaskFormDialog from "./TaskFormDialog";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) return v;
    return fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [tasks, setTasks] = useState(function () {
    const saved = localStorage.getItem("tasks");
    if (!saved) return [];
    return safeParse(saved, []);
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask(data) {
    const nowUtc = new Date().toISOString();
    const dueUtc = new Date(data.due).toISOString();

    const task = {
      id: Date.now(),
      title: data.title,
      desc: data.desc,
      due: dueUtc,
      createdAt: nowUtc,
      editedAt: null,
    };

    setTasks(function (prev) {
      return prev.concat(task);
    });
  }

  function editTask(data) {
    const nowUtc = new Date().toISOString();
    const dueUtc = new Date(data.due).toISOString();

    setTasks(function (prev) {
      const out = [];
      for (let i = 0; i < prev.length; i++) {
        const t = prev[i];
        if (t.id === data.id) {
          out.push({
            id: t.id,
            title: data.title,
            desc: data.desc,
            due: dueUtc,
            createdAt: t.createdAt,
            editedAt: nowUtc,
          });
        } else {
          out.push(t);
        }
      }
      return out;
    });
  }

  function deleteTask(id) {
    setTasks(function (prev) {
      const out = [];
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== id) out.push(prev[i]);
      }
      return out;
    });
  }

  function reorderTasks(newTasks) {
    setTasks(newTasks);
  }

  return (
    <div>
      <header>
        <h1>My To-Do List</h1>
      </header>

      <TaskFormDialog
        tasks={tasks}
        onAdd={addTask}
        onEdit={editTask}
        onDelete={deleteTask}
        onReorder={reorderTasks}
      />
    </div>
  );
}
