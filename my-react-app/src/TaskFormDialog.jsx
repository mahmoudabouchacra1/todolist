import { useEffect, useMemo, useRef, useState } from "react";

export default function TaskFormDialog({
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  onStart,
  onStop,
  onToggleComplete,
}) {
  const dialogRef = useRef(null);
  const deleteDlgRef = useRef(null);

  const [mode, setMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({ title: "", desc: "", due: "" });
  const [touched, setTouched] = useState({ title: false, desc: false, due: false });

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 3;

  const [nowMs, setNowMs] = useState(function () {
    return new Date().getTime();
  });

  const [tickMs, setTickMs] = useState(function () {
    return new Date().getTime();
  });

  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  useEffect(() => {
    const timerNow = setInterval(() => {
      setNowMs(new Date().getTime());
    }, 15000);
    return () => clearInterval(timerNow);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTickMs(new Date().getTime());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const timerSearch = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 2000);
    return () => clearTimeout(timerSearch);
  }, [searchInput]);

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function nowLocalInput() {
    const d = new Date(nowMs);
    return (
      d.getFullYear() +
      "-" +
      pad2(d.getMonth() + 1) +
      "-" +
      pad2(d.getDate()) +
      "T" +
      pad2(d.getHours()) +
      ":" +
      pad2(d.getMinutes())
    );
  }

  function toLocal(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return pad2(h) + ":" + pad2(m) + ":" + pad2(s);
  }

  function getLiveDuration(t) {
    const base = t.durationMs || 0;
    if (t.running && t.startedAt != null) {
      return base + Math.max(0, tickMs - t.startedAt);
    }
    return base;
  }

  function validateTitle(v) {
    const s = (v || "").trim();
    if (!s) return "Title is required.";
    if (s.length < 3) return "Title must be at least 3 characters.";
    if (s.length > 40) return "Title must be 40 characters or less.";
    return "";
  }

  function validateDesc(v) {
    const s = (v || "").trim();
    if (!s) return "Description is required.";
    if (s.length < 10) return "Description must be at least 10 characters.";
    if (s.length > 200) return "Description must be 200 characters or less.";
    return "";
  }

  function validateDue(v) {
    if (!v) return "Due date is required.";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Invalid due date.";
    if (d.getTime() < nowMs + 60000) return "Due date must be at least 1 minute from now.";
    return "";
  }

  const errors = {
    title: validateTitle(form.title),
    desc: validateDesc(form.desc),
    due: validateDue(form.due),
  };

  const canSubmit = errors.title === "" && errors.desc === "" && errors.due === "";

  function setField(key, value) {
    setForm(function (p) {
      return {
        title: key === "title" ? value : p.title,
        desc: key === "desc" ? value : p.desc,
        due: key === "due" ? value : p.due,
      };
    });
  }

  function markTouched(key) {
    setTouched(function (p) {
      return {
        title: key === "title" ? true : p.title,
        desc: key === "desc" ? true : p.desc,
        due: key === "due" ? true : p.due,
      };
    });
  }

  function touchAll() {
    setTouched({ title: true, desc: true, due: true });
  }

  function resetDialogState() {
    setForm({ title: "", desc: "", due: "" });
    setTouched({ title: false, desc: false, due: false });
    setEditingId(null);
    setMode("add");
  }

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setForm({ title: "", desc: "", due: "" });
    setTouched({ title: false, desc: false, due: false });
    if (dialogRef.current) dialogRef.current.showModal();
  }

  function openEdit(t) {
    setMode("edit");
    setEditingId(t.id);
    setForm({
      title: t.title || "",
      desc: t.desc || "",
      due: t.due ? new Date(t.due).toISOString().slice(0, 16) : "",
    });
    setTouched({ title: false, desc: false, due: false });
    if (dialogRef.current) dialogRef.current.showModal();
  }

  function closeDialog() {
    if (dialogRef.current) dialogRef.current.close();
    resetDialogState();
  }

  function submitDialog(e) {
    if (e) e.preventDefault();
    touchAll();
    if (!canSubmit) return;

    if (mode === "edit") {
      onEdit({
        id: editingId,
        title: form.title.trim(),
        desc: form.desc.trim(),
        due: form.due,
      });
    } else {
      onAdd({
        title: form.title.trim(),
        desc: form.desc.trim(),
        due: form.due,
      });
    }

    closeDialog();
  }

  function openDelete(id) {
    setDeleteId(id);
    if (deleteDlgRef.current) deleteDlgRef.current.showModal();
  }

  function closeDelete() {
    if (deleteDlgRef.current) deleteDlgRef.current.close();
    setDeleteId(null);
  }

  function confirmDelete() {
    onDelete(deleteId);
    closeDelete();
  }

  const filtered = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return tasks;

    const out = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const a = (t.title || "").toLowerCase();
      const b = (t.desc || "").toLowerCase();
      if (a.indexOf(q) !== -1 || b.indexOf(q) !== -1) out.push(t);
    }
    return out;
  }, [tasks, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.max(1, Math.min(page, pageCount));

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  function prevPage() {
    if (currentPage > 1) setPage(currentPage - 1);
  }

  function nextPage() {
    if (currentPage < pageCount) setPage(currentPage + 1);
  }

  function moveInArray(list, fromIndex, toIndex) {
    const copy = list.slice();
    const item = copy[fromIndex];
    copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    return copy;
  }

  function reorderTasksByIds(fromId, toId) {
    if (!onReorder) return;
    if (!fromId || !toId) return;
    if (fromId === toId) return;

    let fi = -1;
    let ti = -1;

    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === fromId) fi = i;
      if (tasks[i].id === toId) ti = i;
    }

    if (fi === -1 || ti === -1) return;

    const newTasks = moveInArray(tasks, fi, ti);
    onReorder(newTasks);
  }

  function onDragStartRow(id, e) {
    setDragId(id);
    setOverId(null);

    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(id));
    }
  }

  function onDragOverRow(id, e) {
    if (e) e.preventDefault();
    setOverId(id);
    if (e && e.dataTransfer) e.dataTransfer.dropEffect = "move";
  }

  function onDropRow(id, e) {
    if (e) e.preventDefault();
    const from = dragId;
    const to = id;
    setDragId(null);
    setOverId(null);
    reorderTasksByIds(from, to);
  }

  function onDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  const rows = [];

  if (pageItems.length === 0) {
    rows.push(
      <tr key="empty">
        <td colSpan="9">No tasks found</td>
      </tr>
    );
  } else {
    for (let i = 0; i < pageItems.length; i++) {
      const t = pageItems[i];
      const isOver = overId === t.id;
      const isDragging = dragId === t.id;
      const live = formatDuration(getLiveDuration(t));

      rows.push(
        <tr
          key={t.id}
          onDragOver={function (e) {
            onDragOverRow(t.id, e);
          }}
          onDrop={function (e) {
            onDropRow(t.id, e);
          }}
          className={(t.done ? "isDone " : "") + (isOver ? "dragOver" : isDragging ? "dragging" : "")}
        >
          <td style={{ width: "44px" }}>
            <span
              className="dragHandle"
              draggable={true}
              onDragStart={function (e) {
                onDragStartRow(t.id, e);
              }}
              onDragEnd={onDragEnd}
              title="Drag to reorder"
            >
              ☰
            </span>
          </td>
          <td>{t.title}</td>
          <td className="desc">{t.desc}</td>
          <td>{toLocal(t.due)}</td>
          <td className="timerText">{live}</td>
          <td>{toLocal(t.createdAt)}</td>
          <td>{toLocal(t.editedAt)}</td>
          <td className="actionsCell">
            <button type="button" onClick={function () { openEdit(t); }}>
              Edit
            </button>
            {!t.done && !t.running ? (
              <button type="button" onClick={function () { onStart(t.id); }}>
                Start
              </button>
            ) : null}
            {!t.done && t.running ? (
              <button type="button" onClick={function () { onStop(t.id); }}>
                Stop
              </button>
            ) : null}
            <button type="button" onClick={function () { onToggleComplete(t.id); }}>
              {t.done ? "Uncomplete" : "Complete"}
            </button>
            <button type="button" onClick={function () { openDelete(t.id); }}>
              Delete
            </button>
          </td>
        </tr>
      );
    }
  }

  return (
    <>
      <div className="toolsRow">
        <button type="button" onClick={openAdd}>
          Add Task
        </button>

        <div className="field" style={{ width: "100%" }}>
          <input
            id="searchInput"
            value={searchInput}
            placeholder="Search by title or description..."
            onChange={function (e) {
              setSearchInput(e.target.value);
            }}
          />
        </div>

        <div className="pagination">
          <button type="button" onClick={prevPage} disabled={currentPage <= 1}>
            Prev
          </button>
          <span className="pageInfo">
            Page {currentPage} of {pageCount}
          </span>
          <button type="button" onClick={nextPage} disabled={currentPage >= pageCount}>
            Next
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "44px" }}></th>
            <th>Title</th>
            <th>Description</th>
            <th>Due (Local)</th>
            <th>Timer</th>
            <th>Created (Local)</th>
            <th>Edited (Local)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>

      <dialog ref={dialogRef} className="editDialog" onCancel={closeDialog}>
        <h2>{mode === "edit" ? "Edit Task" : "Add Task"}</h2>

        <form onSubmit={submitDialog} className="dialogForm">
          <label>
            Title
            <input
              value={form.title}
              onChange={function (e) {
                setField("title", e.target.value);
              }}
              onBlur={function () {
                markTouched("title");
              }}
              className={touched.title && errors.title ? "invalid" : ""}
            />
            <div className={"error " + (touched.title && errors.title ? "show" : "")}>
              {touched.title && errors.title ? errors.title : " "}
            </div>
          </label>

          <label>
            Description
            <textarea
              rows={4}
              value={form.desc}
              onChange={function (e) {
                setField("desc", e.target.value);
              }}
              onBlur={function () {
                markTouched("desc");
              }}
              className={touched.desc && errors.desc ? "invalid" : ""}
            />
            <div className={"error " + (touched.desc && errors.desc ? "show" : "")}>
              {touched.desc && errors.desc ? errors.desc : " "}
            </div>
          </label>

          <label>
            Due Date
            <input
              type="datetime-local"
              value={form.due}
              min={nowLocalInput()}
              onChange={function (e) {
                setField("due", e.target.value);
              }}
              onBlur={function () {
                markTouched("due");
              }}
              className={touched.due && errors.due ? "invalid" : ""}
            />
            <div className={"error " + (touched.due && errors.due ? "show" : "")}>
              {touched.due && errors.due ? errors.due : " "}
            </div>
          </label>

          <div className="dialogBtns">
            <button type="button" onClick={closeDialog}>
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit}>
              {mode === "edit" ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={deleteDlgRef} className="deleteDialog" onCancel={closeDelete}>
        <h2>Delete Task</h2>
        <p style={{ padding: "0 18px 12px", fontWeight: 700 }}>
          Are you sure you want to delete this task?
        </p>

        <div className="dialogBtns" style={{ padding: "0 18px 18px" }}>
          <button type="button" onClick={closeDelete}>
            Cancel
          </button>
          <button type="button" className="dangerBtn" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </dialog>
    </>
  );
}
