export default function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="card flex flex-col gap-1 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-3xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: accent || "var(--text)" }}>
        {value ?? <div className="skeleton h-8 w-20" />}
      </div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{sub}</div>}
    </div>
  );
}
