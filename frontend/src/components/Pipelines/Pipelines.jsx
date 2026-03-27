import { useState, useEffect, useCallback } from "react";
import { pipelineAPI } from "../../utils/api";
import PageHeader from "../shared/PageHeader";
import Badge from "../shared/Badge";
import { formatDistanceToNow } from "date-fns";

const GATE_ICON = { passed: "✓", failed: "✗", skipped: "–", running: "◌" };
const GATE_COLOR = { passed: "var(--accent)", failed: "var(--danger)", skipped: "var(--muted)", running: "var(--info)" };

export default function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", page: 1 });
  const [expanded, setExpanded] = useState(null);

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const res = await pipelineAPI.getAll(params);
      setPipelines(res.data.pipelines);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const toggle = (id) => setExpanded(e => e === id ? null : id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CI/CD Pipeline Gates"
        subtitle="Security gate results across all pipeline runs"
      />

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap mb-5">
        {["passed", "failed", "blocked", "running"].map(s => (
          <button key={s}
            onClick={() => setFilters(f => ({ ...f, status: f.status === s ? "" : s, page: 1 }))}
            className="badge capitalize cursor-pointer transition-all"
            style={{
              padding: "6px 14px", fontSize: "0.8rem",
              background: filters.status === s ? `${GATE_COLOR[s]}22` : "var(--surface)",
              color: filters.status === s ? GATE_COLOR[s] : "var(--text-dim)",
              border: `1px solid ${filters.status === s ? GATE_COLOR[s] + "55" : "var(--border)"}`,
            }}>{s}</button>
        ))}
        <button onClick={() => setFilters({ status: "", page: 1 })} className="btn btn-ghost text-xs ml-auto">Clear</button>
      </div>

      {/* Pipeline list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
        ) : pipelines.length === 0 ? (
          <div className="card text-center py-12" style={{ color: "var(--text-dim)" }}>No pipelines found</div>
        ) : pipelines.map(p => (
          <div key={p._id} className="card p-0 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
              onClick={() => toggle(p._id)}
              style={{ background: expanded === p._id ? "rgba(255,255,255,0.02)" : "transparent" }}>
              {/* Status indicator */}
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GATE_COLOR[p.status] || "var(--muted)" }} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <Badge value={p.status} type="status" />
                  <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>{p.ciProvider?.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs font-mono" style={{ color: "var(--text-dim)" }}>
                  <span>{p.repository}</span>
                  <span>{p.branch}</span>
                  <span title={p.commitHash}>{p.commitHash?.slice(0, 7)}</span>
                  <span>{p.author}</span>
                </div>
              </div>

              {/* Gate summary pills */}
              <div className="hidden md:flex items-center gap-2">
                {p.securityGates?.map((g, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <span style={{ color: GATE_COLOR[g.status] }}>{GATE_ICON[g.status]}</span>
                    <span style={{ color: "var(--text-dim)" }}>{g.type}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs shrink-0" style={{ color: "var(--text-dim)" }}>
                {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
              </div>
              <span className="text-sm" style={{ color: "var(--text-dim)" }}>{expanded === p._id ? "▲" : "▼"}</span>
            </div>

            {/* Expanded gates detail */}
            {expanded === p._id && (
              <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="pt-4 text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>Security Gates</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {p.securityGates?.map((g, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg"
                      style={{ background: "var(--bg)", border: `1px solid ${GATE_COLOR[g.status]}33` }}>
                      <div>
                        <div className="font-medium text-sm">{g.name}</div>
                        <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-dim)" }}>{g.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: GATE_COLOR[g.status] }}>
                          {GATE_ICON[g.status]} {g.status}
                        </div>
                        {g.findingCount > 0 && (
                          <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>{g.findingCount} findings</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {p.commitMessage && (
                  <div className="mt-3 text-xs font-mono px-4 py-2 rounded-lg"
                    style={{ background: "var(--bg)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                    git: {p.commitMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>Page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-xs" disabled={pagination.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            <button className="btn btn-ghost text-xs" disabled={pagination.page >= pagination.pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
