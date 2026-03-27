import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../../utils/api";
import { useSocket } from "../../hooks/useSocket";
import PageHeader from "../shared/PageHeader";
import StatCard from "../shared/StatCard";
import Badge from "../shared/Badge";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { formatDistanceToNow } from "date-fns";

const SEV_COLORS = { critical: "#ff4560", high: "#f5a623", medium: "#3b9eff", low: "#00e5a0", info: "#94a3b8" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card text-xs py-2 px-3" style={{ border: "1px solid var(--border)", minWidth: 120 }}>
      <div className="font-mono mb-1" style={{ color: "var(--text-dim)" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--text-dim)" }}>{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useSocket({ "vulnerabilities:new": fetchData, "remediation:updated": fetchData });

  const postureColor = data
    ? data.postureScore >= 80 ? "var(--accent)" : data.postureScore >= 50 ? "var(--warn)" : "var(--danger)"
    : "var(--text-dim)";

  const severityPieData = data
    ? Object.entries(data.severityBreakdown).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Security Dashboard"
        subtitle="Real-time overview of your security posture"
        action={
          <button onClick={fetchData} className="btn btn-ghost text-xs">
            ↻ Refresh
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Posture Score"
          value={loading ? null : `${data?.postureScore}/100`}
          sub={data?.postureScore >= 80 ? "Good standing" : data?.postureScore >= 50 ? "Needs attention" : "Critical risk"}
          accent={postureColor}
          icon="◈"
        />
        <StatCard
          label="Open Vulnerabilities"
          value={loading ? null : data?.vulnerabilities?.open}
          sub={`${data?.vulnerabilities?.in_progress ?? 0} in progress`}
          accent="var(--danger)"
          icon="⚠"
        />
        <StatCard
          label="Scans This Month"
          value={loading ? null : data?.scansThisMonth}
          sub="Across all repos"
          accent="var(--info)"
          icon="⟳"
        />
        <StatCard
          label="Pipelines (7d)"
          value={loading ? null : (data?.pipelines?.passed ?? 0) + (data?.pipelines?.failed ?? 0)}
          sub={`${data?.pipelines?.failed ?? 0} failed gates`}
          accent="var(--warn)"
          icon="⬡"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Trend chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>Finding Trends (14 days)</div>
          </div>
          {loading ? (
            <div className="skeleton h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.trendData || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  {["critical", "high", "medium"].map((s) => (
                    <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEV_COLORS[s]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={SEV_COLORS[s]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "var(--text-dim)", fontFamily: "JetBrains Mono" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} />
                <Tooltip content={<CustomTooltip />} />
                {["critical", "high", "medium"].map((s) => (
                  <Area key={s} type="monotone" dataKey={s} stroke={SEV_COLORS[s]}
                    strokeWidth={2} fill={`url(#grad-${s})`} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Severity pie */}
        <div className="card">
          <div className="text-sm font-semibold mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Open by Severity</div>
          {loading ? (
            <div className="skeleton h-48" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={severityPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {severityPieData.map((entry) => (
                      <Cell key={entry.name} fill={SEV_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {severityPieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SEV_COLORS[d.name] }} />
                      <span className="capitalize" style={{ color: "var(--text-dim)" }}>{d.name}</span>
                    </div>
                    <span className="font-mono font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pipeline gates + Recent critical */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline bar */}
        <div className="card">
          <div className="text-sm font-semibold mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Pipeline Gates (7 days)</div>
          {loading ? <div className="skeleton h-36" /> : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                data={[{ name: "Gates", ...data?.pipelines }]}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-dim)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="passed" fill="#00e5a0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="#ff4560" radius={[4, 4, 0, 0]} />
                <Bar dataKey="blocked" fill="#f5a623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent critical vulns */}
        <div className="card">
          <div className="text-sm font-semibold mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Recent Critical / High</div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
          ) : data?.recentCritical?.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: "var(--text-dim)" }}>No critical findings 🎉</div>
          ) : (
            <div className="space-y-2">
              {data?.recentCritical?.map((v) => (
                <div key={v._id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-xs font-medium truncate">{v.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>
                      {v.repository} · {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <Badge value={v.severity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
