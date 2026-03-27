import { useState, useEffect, useCallback } from "react";
import { remediationAPI, vulnAPI, authAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../shared/PageHeader";
import Badge from "../shared/Badge";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_ORDER = ["open", "in_progress", "review", "done", "wont_fix"];
const PRIORITY_COLOR = { urgent: "var(--danger)", high: "var(--warn)", medium: "var(--info)", low: "var(--accent)" };

export default function Remediation() {
  const { canEdit, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", page: 1 });
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [openVulns, setOpenVulns] = useState([]);
  const [users, setUsers] = useState([]);
  const [createForm, setCreateForm] = useState({ vulnerability: "", title: "", description: "", priority: "medium", dueDate: "", assignedTo: "", fixSuggestion: "" });
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const res = await remediationAPI.getAll(params);
      setTasks(res.data.remediations);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!canEdit) return;
    Promise.all([
      vulnAPI.getAll({ status: "open", limit: 50 }),
      authAPI.getUsers(),
    ]).then(([vRes, uRes]) => {
      setOpenVulns(vRes.data.vulnerabilities);
      setUsers(uRes.data.users);
    }).catch(() => {});
  }, [canEdit]);

  const updateTask = async (id, data) => {
    setUpdating(true);
    try {
      const res = await remediationAPI.update(id, data);
      setTasks(t => t.map(x => x._id === id ? res.data.remediation : x));
      if (selected?._id === id) setSelected(res.data.remediation);
      setNote("");
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await remediationAPI.create(createForm);
      setShowCreate(false);
      setCreateForm({ vulnerability: "", title: "", description: "", priority: "medium", dueDate: "", assignedTo: "", fixSuggestion: "" });
      fetchTasks();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  // Group tasks by status for kanban-style summary
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Remediation"
        subtitle="Track and resolve security findings"
        action={canEdit && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs">+ New Task</button>
        )}
      />

      {/* Status summary bar */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {STATUS_ORDER.map(s => (
          <div key={s} className="card text-center cursor-pointer transition-all"
            style={{ border: filters.status === s ? "1px solid var(--accent)" : "1px solid var(--border)" }}
            onClick={() => setFilters(f => ({ ...f, status: f.status === s ? "" : s, page: 1 }))}>
            <div className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{byStatus[s] || 0}</div>
            <div className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-dim)" }}>{s.replace("_", " ")}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-wrap gap-3">
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))} style={{ maxWidth: 160 }}>
          <option value="">All priorities</option>
          {["urgent", "high", "medium", "low"].map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={() => setFilters({ status: "", priority: "", page: 1 })} className="btn btn-ghost text-xs ml-auto">Clear</button>
      </div>

      {/* Tasks list */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {["Task", "Vulnerability", "Priority", "Status", "Assigned To", "Due", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4" /></td>)}
                </tr>
              )) : tasks.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12" style={{ color: "var(--text-dim)" }}>No remediation tasks found</td></tr>
              ) : tasks.map(t => (
                <tr key={t._id} onClick={() => setSelected(t)} className="cursor-pointer"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>{t.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    {t.vulnerability && (
                      <div>
                        <div className="text-xs truncate max-w-[160px]">{t.vulnerability.title}</div>
                        <Badge value={t.vulnerability.severity} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ background: `${PRIORITY_COLOR[t.priority]}18`, color: PRIORITY_COLOR[t.priority], border: `1px solid ${PRIORITY_COLOR[t.priority]}44` }}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <select value={t.status} onClick={e => e.stopPropagation()}
                        onChange={e => updateTask(t._id, { status: e.target.value })}
                        style={{ padding: "2px 6px", fontSize: "0.75rem", width: "auto", minWidth: 110 }}>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    ) : <Badge value={t.status} type="status" />}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-dim)" }}>
                    {t.assignedTo?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: t.dueDate && new Date(t.dueDate) < new Date() ? "var(--danger)" : "var(--text-dim)" }}>
                    {t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
                    {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button className="btn btn-ghost text-xs" disabled={pagination.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
              <button className="btn btn-ghost text-xs" disabled={pagination.page >= pagination.pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto p-6 animate-fade-in"
            style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>{selected.title}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="badge" style={{ background: `${PRIORITY_COLOR[selected.priority]}18`, color: PRIORITY_COLOR[selected.priority], border: `1px solid ${PRIORITY_COLOR[selected.priority]}44` }}>
                    {selected.priority}
                  </span>
                  <Badge value={selected.status} type="status" />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xl" style={{ color: "var(--muted)" }}>✕</button>
            </div>

            <div className="space-y-4 text-sm">
              {selected.description && (
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>Description</div>
                  <div>{selected.description}</div>
                </div>
              )}
              {selected.fixSuggestion && (
                <div>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>Fix Suggestion</div>
                  <div className="text-xs p-3 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>{selected.fixSuggestion}</div>
                </div>
              )}

              {canEdit && (
                <div>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>Update Status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map(s => (
                      <button key={s} onClick={() => updateTask(selected._id, { status: s })}
                        disabled={updating || selected.status === s}
                        className="text-xs px-3 py-1.5 rounded-lg capitalize transition-all"
                        style={{
                          background: selected.status === s ? "var(--accent)" : "var(--bg)",
                          color: selected.status === s ? "#0a0c10" : "var(--text-dim)",
                          border: "1px solid var(--border)",
                          fontWeight: selected.status === s ? 600 : 400,
                        }}>
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>Notes ({selected.notes?.length || 0})</div>
                <div className="space-y-2 mb-3">
                  {selected.notes?.map((n, i) => (
                    <div key={i} className="text-xs p-3 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div className="font-semibold mb-0.5" style={{ color: "var(--accent)" }}>{n.author?.name || "User"}</div>
                      <div>{n.text}</div>
                      <div className="mt-1" style={{ color: "var(--muted)" }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." className="flex-1 text-xs" />
                    <button onClick={() => note && updateTask(selected._id, { note })} disabled={!note || updating}
                      className="btn btn-primary text-xs px-3">Add</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowCreate(false)}>
          <div className="card w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Create Remediation Task</h3>
            <form onSubmit={createTask} className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-dim)" }}>Vulnerability*</label>
                <select required value={createForm.vulnerability} onChange={e => {
                  const v = openVulns.find(x => x._id === e.target.value);
                  setCreateForm(f => ({ ...f, vulnerability: e.target.value, title: v ? `Fix: ${v.title}` : f.title }));
                }}>
                  <option value="">Select a vulnerability...</option>
                  {openVulns.map(v => <option key={v._id} value={v._id}>[{v.severity.toUpperCase()}] {v.title}</option>)}
                </select>
              </div>
              <input required placeholder="Task title*" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} />
              <textarea rows={2} placeholder="Description" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "vertical" }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-dim)" }}>Priority</label>
                  <select value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}>
                    {["urgent", "high", "medium", "low"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-dim)" }}>Assign To</label>
                  <select value={createForm.assignedTo} onChange={e => setCreateForm(f => ({ ...f, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--text-dim)" }}>Due Date</label>
                <input type="date" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <textarea rows={2} placeholder="Fix suggestion (optional)" value={createForm.fixSuggestion}
                onChange={e => setCreateForm(f => ({ ...f, fixSuggestion: e.target.value }))} style={{ resize: "vertical" }} />
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={creating}>{creating ? "Creating..." : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
