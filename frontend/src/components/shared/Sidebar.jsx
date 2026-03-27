import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/dashboard",       label: "Dashboard",       icon: "◈" },
  { to: "/vulnerabilities", label: "Vulnerabilities",  icon: "⚠" },
  { to: "/scans",           label: "Scans",            icon: "⟳" },
  { to: "/pipelines",       label: "Pipelines",        icon: "⬡" },
  { to: "/remediation",     label: "Remediation",      icon: "✦" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="flex flex-col h-screen w-56 shrink-0" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "var(--accent)", color: "#0a0c10", fontFamily: "Syne, sans-serif" }}>S</div>
        <span className="font-bold text-base tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>SecureDash</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive ? "text-white" : "hover:bg-white/5"
            }`
          }
          style={({ isActive }) => ({
            background: isActive ? "rgba(0,229,160,0.12)" : "transparent",
            color: isActive ? "var(--accent)" : "var(--text-dim)",
            fontFamily: "DM Sans, sans-serif",
          })}>
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 space-y-1" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <div className="px-3 py-2 rounded-lg" style={{ background: "var(--bg)" }}>
          <div className="text-sm font-medium truncate">{user?.name}</div>
          <div className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{user?.email}</div>
          <span className="badge mt-1" style={{
            background: user?.role === "admin" ? "rgba(0,229,160,0.12)" : user?.role === "engineer" ? "rgba(59,158,255,0.12)" : "rgba(148,163,184,0.1)",
            color: user?.role === "admin" ? "var(--accent)" : user?.role === "engineer" ? "var(--info)" : "var(--text-dim)",
            border: "none", fontSize: "0.65rem",
          }}>{user?.role}</span>
        </div>
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
          style={{ color: "var(--muted)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(255,69,96,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}>
          ⇤ Sign out
        </button>
      </div>
    </aside>
  );
}
