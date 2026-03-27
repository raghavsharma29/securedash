import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";

export default function Layout() {
  const [toast, setToast] = useState(null);

  useSocket({
    "vulnerabilities:new": (data) => {
      setToast({ msg: `${data.count} new vulnerabilities from ${data.scanType} scan`, type: "warn" });
    },
    "remediation:updated": (data) => {
      setToast({ msg: `Remediation task status updated to ${data.status}`, type: "info" });
    },
    "pipelines:new": () => {
      setToast({ msg: "New pipeline run started", type: "info" });
    },
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6">
          <Outlet />
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-fade-in z-50"
          style={{
            background: "var(--surface)",
            border: `1px solid ${toast.type === "warn" ? "rgba(245,166,35,0.4)" : "rgba(59,158,255,0.4)"}`,
            color: toast.type === "warn" ? "var(--warn)" : "var(--info)",
            maxWidth: "320px",
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
