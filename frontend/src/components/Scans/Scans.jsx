import { useState, useEffect, useCallback } from "react";
import { scanAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../shared/PageHeader";
import Badge from "../shared/Badge";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SCAN_TYPES = ["SAST", "DAST", "dependency", "container", "secret"];
const SCANNERS = ["Semgrep", "Bandit", "OWASP ZAP", "Snyk", "Trivy", "Gitleaks"];

export default function Scans() {
  const { canEdit } = useAuth();
  const [scans, setScans] = useState([]);
  const [trend, setTrend] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ scanType: "", status: "", page: 1 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", scanType: "SAST", scanner: "Semgrep", repository: "", branch: "main", status: "completed", duration: 120, findings: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } });
  const [submitting, setSubmitting] = useState(false);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const [scanRes, trendRes] = await Promise.all([scanAPI.getAll(params), scanAPI.getTrend(14)]);
      setScans(scanRes.data.scans);
      setPagination(scanRes.data.pagination);
      setTrend(trendRes.data.trend);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const total = Object.values(form.findings).reduce((a, b) => a + Number(b), 0);
      await scanAPI.create({ ...form, totalFindings: total, findings: Object.fromEntries(Object.entries(form.findings).map(([k, v]) => [k, Number(v)])) });
      setShowForm(false);
      setForm({ name: "", scanType: "SAST", scanner: "Semgrep", repository: "", branch: "main", status: "completed", duration: 120, findings: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } });
      fetchScans();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const SEV = { critical: "#ff4560", high: "#f5a623", medium: "#3b9eff", low: "#00e5a0" };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Scan History"
        subtitle="All security scans across repositories"
        action={canEdit && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary text-xs">+ Log Scan</button>
        )}
      />

      {/* Trend chart */}
      <div className="card mb-5">
        <div className="text-sm font-semibold mb-3" style={{ fontFamily: "Syne, sans-serif" }}>14-Day Finding Trend</div>
        {loading ? <div className="skeleton h-40" /> : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "var(--text-dim)", fontFamily: "JetBrains Mono" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              {Object.entries(SEV).map(([k, c]) => <Bar key={k} dataKey={k} fill={c} radius={[3, 3, 0, 0]} stackId="a" />)}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-wrap gap-3">
        <select value={filters.scanType} onChange={e => setFilters(f => ({ ...f, scanType: e.target.value, page: 1 }))} style={{ maxWidth: 160 }}>
          <option value="">All types</option>
          {SCAN_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} style={{ maxWidth: 160 }}>
          <option value="">All statuses</option>
          {["completed", "failed", "running"].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setFilters({ scanType: "", status: "", page: 1 })} className="btn btn-ghost text-xs ml-auto">Clear</button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                {["Scan", "Type", "Scanner", "Repository", "Findings", "Duration", "Status", "When"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4" /></td>)}
                </tr>
              )) : scans.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-10" style={{ color: "var(--text-dim)" }}>No scans found</td></tr>
              ) : scans.map(s => (
                <tr key={s._id} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="px-4 py-3">
                    <div className="font-medium max-w-xs truncate">{s.name}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>{s.commitHash}</div>
                  </td>
                  <td className="px-4 py-3"><span className="badge badge-info">{s.scanType}</span></td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-dim)" }}>{s.scanner}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-dim)" }}>{s.repository}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {s.findings.critical > 0 && <span className="text-xs font-mono" style={{ color: "#ff4560" }}>C:{s.findings.critical}</span>}
                      {s.findings.high > 0 && <span className="text-xs font-mono" style={{ color: "#f5a623" }}>H:{s.findings.high}</span>}
                      {s.findings.medium > 0 && <span className="text-xs font-mono" style={{ color: "#3b9eff" }}>M:{s.findings.medium}</span>}
                      {s.findings.low > 0 && <span className="text-xs font-mono" style={{ color: "#00e5a0" }}>L:{s.findings.low}</span>}
                      {s.totalFindings === 0 && <span className="text-xs" style={{ color: "var(--text-dim)" }}>Clean</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-dim)" }}>{s.duration}s</td>
                  <td className="px-4 py-3"><Badge value={s.status} type="status" /></td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
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

      {/* Create scan modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}
            style={{ border: "1px solid var(--border)" }}>
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Log Scan Result</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input placeholder="Scan name*" value={form.name} required onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.scanType} onChange={e => setForm(f => ({ ...f, scanType: e.target.value }))}>
                  {SCAN_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={form.scanner} onChange={e => setForm(f => ({ ...f, scanner: e.target.value }))}>
                  {SCANNERS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Repository*" required value={form.repository} onChange={e => setForm(f => ({ ...f, repository: e.target.value }))} />
                <input placeholder="Branch" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Finding Counts</div>
              <div className="grid grid-cols-5 gap-2">
                {["critical", "high", "medium", "low", "info"].map(s => (
                  <div key={s}>
                    <div className="text-xs text-center mb-1 capitalize" style={{ color: "var(--text-dim)" }}>{s.slice(0, 4)}</div>
                    <input type="number" min="0" value={form.findings[s]}
                      onChange={e => setForm(f => ({ ...f, findings: { ...f.findings, [s]: e.target.value } }))}
                      style={{ textAlign: "center", padding: "6px 4px" }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>{submitting ? "Saving..." : "Log Scan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
