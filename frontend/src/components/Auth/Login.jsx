import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: "admin@securedash.io", password: "Admin@123" },
      engineer: { email: "engineer@securedash.io", password: "Eng@123" },
      viewer: { email: "viewer@securedash.io", password: "View@123" },
    };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-40" />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "var(--accent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8" style={{ background: "var(--info)" }} />

      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: "var(--accent)", color: "#0a0c10" }}>
              S
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif", color: "var(--text)" }}>
              SecureDash
            </span>
          </div>
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>Security Visibility Platform</p>
        </div>

        {/* Card */}
        <div className="card" style={{ border: "1px solid var(--border)", padding: "2rem" }}>
          <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: "Syne, sans-serif" }}>Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(255,69,96,0.1)", color: "var(--danger)", border: "1px solid rgba(255,69,96,0.2)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-dim)" }}>Email</label>
              <input
                type="email" placeholder="you@company.io" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--text-dim)" }}>Password</label>
              <input
                type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs mb-3 text-center" style={{ color: "var(--muted)" }}>Demo credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {["admin", "engineer", "viewer"].map((role) => (
                <button key={role} onClick={() => fillDemo(role)}
                  className="text-xs py-1.5 rounded-lg capitalize font-mono transition-all"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
                  onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-dim)"; }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
