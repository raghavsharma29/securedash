# SecureDash 🛡️

A full-stack **Security Visibility Platform** built on the **MERN stack** — giving engineering teams a unified view of their security posture: open vulnerabilities, scan histories, CI/CD pipeline gates, and remediation workflows — with role-based access and real-time WebSocket updates.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt (Admin / Engineer / Viewer roles) |
| Realtime | Socket.IO |
| Containerization | Docker + Docker Compose |

---

## Features

- 🔍 **Vulnerability Management** — Ingest SAST/DAST/Dependency scan results, auto-triage by severity
- 📊 **Security Dashboard** — Posture score, trend charts, severity breakdown
- 🔁 **CI/CD Pipeline Gates** — Security gate pass/fail per pipeline run
- 🛠️ **Remediation Workflows** — Assign, track, and resolve findings
- 👥 **Role-Based Access Control** — Admin / Engineer / Viewer
- ⚡ **Real-time Updates** — Socket.IO live notifications

---

## Project Structure

```
securedash/
├── backend/
│   ├── src/
│   │   ├── config/         # DB + socket config
│   │   ├── controllers/    # Route logic
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   ├── scripts/            # Seed script
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quick Start

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/YOUR_USERNAME/securedash.git
cd securedash
cp backend/.env.example backend/.env
docker-compose up --build
```

### Option 2: Local Dev
```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in values
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit:
- Frontend → http://localhost:5173
- API Docs → http://localhost:5000/api
- Swagger → http://localhost:5000/api-docs

### Seed Database
```bash
cd backend && npm run seed
```

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@securedash.io | Admin@123 |
| Engineer | engineer@securedash.io | Eng@123 |
| Viewer | viewer@securedash.io | View@123 |

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/vulnerabilities` | ✅ | List vulns |
| POST | `/api/vulnerabilities/ingest` | Admin/Eng | Ingest scan results |
| PATCH | `/api/vulnerabilities/:id` | Admin/Eng | Update vuln |
| GET | `/api/scans` | ✅ | Scan history |
| POST | `/api/scans` | Admin/Eng | Create scan record |
| GET | `/api/pipelines` | ✅ | Pipeline gates |
| POST | `/api/pipelines` | Admin/Eng | Add pipeline run |
| GET | `/api/remediation` | ✅ | Remediation tasks |
| PATCH | `/api/remediation/:id` | Admin/Eng | Update task |
| GET | `/api/dashboard/summary` | ✅ | Posture summary |

---

## Push to GitHub

```bash
chmod +x scripts/github_push.sh
./scripts/github_push.sh YOUR_GITHUB_USERNAME securedash
```

---

## License
MIT
