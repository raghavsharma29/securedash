import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sd_token");
      localStorage.removeItem("sd_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  register: (data) => api.post("/auth/register", data),
  getUsers: () => api.get("/auth/users"),
};

// Dashboard
export const dashboardAPI = {
  getSummary: () => api.get("/dashboard/summary"),
};

// Vulnerabilities
export const vulnAPI = {
  getAll: (params) => api.get("/vulnerabilities", { params }),
  getOne: (id) => api.get(`/vulnerabilities/${id}`),
  ingest: (data) => api.post("/vulnerabilities/ingest", data),
  update: (id, data) => api.patch(`/vulnerabilities/${id}`, data),
  delete: (id) => api.delete(`/vulnerabilities/${id}`),
};

// Scans
export const scanAPI = {
  getAll: (params) => api.get("/scans", { params }),
  getOne: (id) => api.get(`/scans/${id}`),
  create: (data) => api.post("/scans", data),
  update: (id, data) => api.patch(`/scans/${id}`, data),
  getTrend: (days) => api.get("/scans/stats/trend", { params: { days } }),
};

// Pipelines
export const pipelineAPI = {
  getAll: (params) => api.get("/pipelines", { params }),
  getOne: (id) => api.get(`/pipelines/${id}`),
  create: (data) => api.post("/pipelines", data),
  update: (id, data) => api.patch(`/pipelines/${id}`, data),
  getGateSummary: () => api.get("/pipelines/stats/gate-summary"),
};

// Remediation
export const remediationAPI = {
  getAll: (params) => api.get("/remediation", { params }),
  getOne: (id) => api.get(`/remediation/${id}`),
  create: (data) => api.post("/remediation", data),
  update: (id, data) => api.patch(`/remediation/${id}`, data),
};
