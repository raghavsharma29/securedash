import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/shared/Layout";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import Vulnerabilities from "./components/Vulnerabilities/Vulnerabilities";
import Scans from "./components/Scans/Scans";
import Pipelines from "./components/Pipelines/Pipelines";
import Remediation from "./components/Remediation/Remediation";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>Initializing SecureDash...</span>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vulnerabilities" element={<Vulnerabilities />} />
            <Route path="scans" element={<Scans />} />
            <Route path="pipelines" element={<Pipelines />} />
            <Route path="remediation" element={<Remediation />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
