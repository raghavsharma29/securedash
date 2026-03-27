import { useState, useEffect, useCallback } from "react";
import { vulnAPI, authAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../shared/PageHeader";
import Badge from "../shared/Badge";
import { formatDistanceToNow } from "date-fns";

const SEVERITIES = ["", "critical", "high", "medium", "low", "info"];
const STATUSES = ["", "open", "in_progress", "resolved", "false_positive"];
const SCAN_TYPES = ["", "SAST", "DAST", "dependency", "container", "secret"];

export default function Vulnerabilities() {
  const { canEdit } = useAuth();
  const [vulns, setVulns] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: "", status: "", scanType: "", search: "", page: 1 });
  const [updating, setUpdating] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchVulns = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const res = await vulnAPI.getAll(params);
      setVulns(res.data.vulnerabilities);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchVulns(); }, [fetchVulns]);
  useEffect(() => {
    if (canEdit) authAPI.getUsers().then(r => setUsers(r.data.users)).catch(() => {});
  }, [canEdit]);

  const updateVuln = async (id, data) => {
    setUpdating(id);
    try {
      const res = await vulnAPI.update(id, data);
      setVulns(v => v.map(x => x._id === id ? res.data.vulnerability : x));
      if (selected?._id === id) setSelected(res.data.vulnerability);
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Vulnerabilities" subtitle={`${pagination.total ?? "—"} total findings`} />

      {/* Filters */}
      <div className="card mb-4 flex flex-wrap gap-3 items-center">
        <input placeholder="Search findings..." value={filters.search}
          onChange={e => setFilter("search", e.target.value)}
          style={{ maxWidth: 220 }} />
        {[
          ["severity", SEVERITIES],
          ["status", STATUSES],
          ["scanType", SCAN_TYPES],
        ].map(([key, opts]) => (
          <select key={key} value={filters[key]} onChange={e => setFilter(key, e.target.value)} style={{ maxWidth: 160 }}>
            {opts.map(o => <option key={o} value={o}>{o || `All ${key}s`}</option>)}
          </select>
        ))}
        <button onClick={() => setFilters({ severity: "", status: "", scanType: "", search: "", page: 1 })}
          className="btn btn-ghost text-xs ml-auto">Clear</button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {["Title", "Severity", "Type", "Repository", "Status", "Assigned", "Found"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap" }}>{h}</th>
                ))}
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {[...Array(canEdit ? 8 : 7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : vulns.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12" style={{ color: "var(--text-dim)" }}>No vulnerabilities found</td></tr>
              ) : vulns.map((v) => (
                <tr key={v._id}
                  onClick={() => setSelected(v)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="truncate font-medium">{v.title}</div>
                    {v.cveId && <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>{v.cveId}</div>}
                  </td>
                  <td className="px-4 py-3"><Badge value={v.severity} /></td>
                  <td className="px-4 py-3"><span className="badge badge-info">{v.scanType}</span></td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-dim)" }}>{v.repository}</td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <select
                        value={v.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateVuln(v._id, { status: e.target.value })}
                        disabled={updating === v._id}
                        style={{ padding: "2px 6px", fontSize: "0.75rem", width: "auto", minWidth: 110 }}
                      >
                        {STATUSES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : <Badge value={v.status} type="status" />}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-dim)" }}>
                    {v.assignedTo ? v.assignedTo.name : (
                      canEdit ? (
                        <select
                          value=""
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateVuln(v._id, { assignedTo: e.target.value })}
                          style={{ padding: "2px 6px", fontSize: "0.75rem", width: "auto" }}
                        >
                          <option value="">Unassigned</option>
                          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                      ) : "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); updateVuln(v._id, { status: "false_positive" }); }}
                        className="text-xs px-2 py-1 rounded" title="Mark false positive"
                        style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>FP</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button className="btn btn-ghost text-xs" disabled={pagination.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
              <button className="btn btn-ghost text-xs" disabled={pagination.page >= pagination.pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
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
                  <Badge value={selected.severity} />
                  <Badge value={selected.status} type="status" />
                  <span className="badge badge-info">{selected.scanType}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xl" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div className="space-y-4 text-sm">
              {[
                ["Description", selected.description || "No description"],
                ["Repository", selected.repository],
                ["Branch", selected.branch],
                ["Scanner", selected.scanner],
                ["CVE ID", selected.cveId || "—"],
                ["CVSS Score", selected.cvssScore || "—"],
                ["Affected File", selected.affectedFile ? `${selected.affectedFile}:${selected.affectedLine}` : "—"],
                ["Affected Package", selected.affectedPackage || "—"],
                ["Assigned To", selected.assignedTo?.name || "Unassigned"],
                ["Discovered", new Date(selected.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>{label}</div>
                  <div style={{ color: "var(--text)", fontFamily: label === "Affected File" ? "JetBrains Mono, monospace" : "inherit", fontSize: label === "Affected File" ? "0.8rem" : "inherit" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
