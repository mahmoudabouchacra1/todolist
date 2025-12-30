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
      running: false,
      done: false,
      startedAt: null,
      durationMs: 0,
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
            ...t,
            title: data.title,
            desc: data.desc,
            due: dueUtc,
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

  function startTask(id) {
    const nowMs = new Date().getTime();
    setTasks(function (prev) {
      const out = [];
      for (let i = 0; i < prev.length; i++) {
        const t = prev[i];
        if (t.id === id) {
          if (t.done || t.running) {
            out.push(t);
          } else {
            out.push({
              ...t,
              running: true,
              startedAt: nowMs,
            });
          }
        } else {
          out.push(t);
        }
      }
      return out;
    });
  }

  function stopTask(id) {
    const nowMs = new Date().getTime();
    setTasks(function (prev) {
      const out = [];
      for (let i = 0; i < prev.length; i++) {
        const t = prev[i];
        if (t.id === id) {
          if (!t.running || t.startedAt == null) {
            out.push(t);
          } else {
            const add = Math.max(0, nowMs - t.startedAt);
            out.push({
              ...t,
              running: false,
              startedAt: null,
              durationMs: (t.durationMs || 0) + add,
            });
          }
        } else {
          out.push(t);
        }
      }
      return out;
    });
  }

  function toggleComplete(id) {
    const nowMs = new Date().getTime();
    setTasks(function (prev) {
      const out = [];
      for (let i = 0; i < prev.length; i++) {
        const t = prev[i];
        if (t.id === id) {
          let duration = t.durationMs || 0;
          let running = t.running || false;
          let startedAt = t.startedAt;

          if (running && startedAt != null) {
            duration = duration + Math.max(0, nowMs - startedAt);
            running = false;
            startedAt = null;
          }

          out.push({
            ...t,
            done: !t.done,
            running: running,
            startedAt: startedAt,
            durationMs: duration,
          });
        } else {
          out.push(t);
        }
      }
      return out;
    });
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
        onStart={startTask}
        onStop={stopTask}
        onToggleComplete={toggleComplete}
      />
    </div>
  );
}
