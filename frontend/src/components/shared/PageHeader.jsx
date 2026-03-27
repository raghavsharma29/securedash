export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
