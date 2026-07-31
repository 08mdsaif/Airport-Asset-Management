# Airport Asset & Maintenance Management System (with AI Modules)

A full-stack MERN application built for an **Airports Authority of India (AAI) internship project**. It lets airport staff track physical assets (baggage carousels, HVAC units, escalators, ground support equipment, etc.), log and resolve maintenance complaints, schedule preventive/corrective maintenance, and view AI-assisted analytics — all with QR-code-based asset lookup and real-time notifications.

## ✨ Features

- **JWT Authentication** with role-based access control (Admin / Supervisor / Employee)
- **Employee & Admin Dashboards** with different views per role
- **Asset Management** — full CRUD, categories, criticality, utilization tracking
- **QR Code Generator & Scanner** — every asset gets an auto-generated QR code; scan it (camera or manual entry) to jump straight to its detail page
- **Complaint Module** with photo attachments
- **AI Complaint Analysis** — Gemini automatically classifies category, severity, sentiment, and suggests a first action the moment a complaint is filed
- **Maintenance Scheduling** with **AI Priority Prediction** (Gemini scores urgency 0–100 based on asset criticality, complaint history, and time since last service)
- **AI-generated maintenance reports** — narrative summaries embedded in PDF exports
- **AI Chat Assistant** ("AAI Assist") for employees, aware of their own open complaints/tasks
- **AI Summary of Asset History** — one-click narrative of an asset's maintenance/complaint lifecycle
- **Real-time Notifications** via Socket.IO (new complaints, critical asset alerts, assignment updates)
- **Reports** — PDF export for maintenance summaries, complaint summaries, and individual asset reports
- **Analytics Dashboard** — 6 charts: assets by department, pending maintenance, critical assets, monthly repair cost, asset utilization, complaint trends
- **Dark Mode** (persisted, system-preference aware)
- **Asset Transfers** between departments with an approval workflow
- **Activity Log / Audit Trail** for admins

## 🏗️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack React Query, Chart.js, React Hook Form, Socket.IO client, html5-qrcode

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, Multer + Cloudinary, Nodemailer, Socket.IO, PDFKit, `qrcode`, Google Gemini API (`@google/generative-ai`)

## 📁 Project Structure

```
airport-asset-management/
├── backend/
│   ├── server.js                # entry point (HTTP + Socket.IO)
│   └── src/
│       ├── app.js               # Express app & route mounting
│       ├── config/              # MongoDB + Cloudinary config
│       ├── models/              # 8 Mongoose schemas
│       ├── middleware/          # auth (JWT+RBAC), upload, error handler
│       ├── controllers/         # business logic per module
│       ├── routes/              # REST API routes
│       ├── services/            # Gemini AI, QR, PDF, email, notifications, Cloudinary
│       ├── socket/               # Socket.IO auth + rooms
│       └── utils/               # helpers + DB seed script
└── frontend/
    └── src/
        ├── api/                  # Axios client
        ├── context/              # Auth, Theme (dark mode), Socket
        ├── routes/               # ProtectedRoute (RBAC)
        ├── components/           # layout, charts, common (incl. AI chat widget)
        ├── pages/                # one folder per module
        └── types/                # shared TypeScript interfaces
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local install or a free MongoDB Atlas cluster)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier available)
- A free [Cloudinary](https://cloudinary.com) account (for image uploads — asset photos, complaint attachments, QR codes)
- (Optional) SMTP credentials for email notifications, e.g. a Gmail App Password

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGO_URI` — e.g. `mongodb://127.0.0.1:27017/airport_asset_mgmt` or your Atlas connection string
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — from Google AI Studio
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard
- `SMTP_*` — optional, only needed if you want email notifications to actually send

Seed the database with demo departments, an admin/supervisor/employee account, and sample assets:

```bash
npm run seed
```

This prints demo login credentials to the console (also see below).

Start the API server:

```bash
npm run dev
```

The API runs on **http://localhost:5000** by default.

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

By default `VITE_API_URL=http://localhost:5000/api`, which matches the backend above.

```bash
npm run dev
```

The app runs on **http://localhost:5173**.

### 3. Demo Logins (after running `npm run seed`)

| Role       | Email                    | Password        |
|------------|--------------------------|------------------|
| Admin      | admin@aai.gov.in         | Admin@123        |
| Supervisor | supervisor@aai.gov.in    | Supervisor@123   |
| Employee   | employee@aai.gov.in      | Employee@123     |

## 🔑 Key API Endpoints

| Module        | Endpoint                              |
|---------------|----------------------------------------|
| Auth          | `POST /api/auth/login`, `/register`, `/me` |
| Assets        | `GET/POST /api/assets`, `GET /api/assets/lookup/:code` (QR scan) |
| Complaints    | `POST /api/complaints` (auto-runs AI classification) |
| Maintenance   | `POST /api/maintenance` (auto-runs AI priority prediction) |
| AI Chat       | `POST /api/ai/chat` |
| Analytics     | `GET /api/analytics/summary`, `/assets-by-department`, `/complaint-trends`, etc. |
| Reports       | `GET /api/reports/maintenance-pdf`, `/complaints-pdf`, `/asset-pdf/:id` |
| Notifications | `GET /api/notifications` (+ Socket.IO `notification:new` events) |

## 📷 About QR Code Generation

Every asset gets a QR code automatically on creation — and this **works with zero external configuration**:

- If Cloudinary credentials are set in `backend/.env`, the QR PNG is uploaded there and a permanent hosted URL is stored.
- If Cloudinary is *not* configured (or the credentials are invalid/still placeholders), the system automatically falls back to storing the QR code as an inline base64 image directly in MongoDB — no upload needed, and it still renders and scans correctly. Asset creation itself can never fail because of a QR/Cloudinary hiccup.

Cloudinary is genuinely required only for **asset photos** and **complaint attachments** (arbitrary user-uploaded images) — if you try to upload one of those without Cloudinary configured, you'll get a clear error message telling you to add the credentials, rather than a cryptic auth failure.

## 🧠 Where the AI Modules Live

All Gemini calls are centralized in `backend/src/services/geminiService.js`:
- `classifyComplaint()` → used in `complaintController.createComplaint` / `reanalyzeComplaint`
- `predictMaintenancePriority()` → used in `maintenanceController.createMaintenanceRecord`
- `generateMaintenanceReport()` → used in `reportController.exportMaintenanceReportPDF`
- `chatAssistant()` → used in `aiController.chat`
- `summarizeAssetHistory()` → used in `assetController.getAssetAISummary`

If a Gemini call fails (e.g. missing/invalid API key), each integration point degrades gracefully — the underlying record is still created, just without the AI fields — so the app keeps working even without a configured key.

## 📝 Notes for Your Internship Report

- Passwords are hashed with bcrypt; JWTs expire after 7 days by default (configurable).
- Real-time updates use per-user Socket.IO rooms plus an `admins` broadcast room.
- Sequential human-readable IDs (`AST-2026-0001`, `CMP-2026-0001`) are generated per-year via `utils/idGenerator.js`.
- File uploads (asset photos, complaint attachments) are streamed as buffers from Multer directly to Cloudinary — no local disk writes, so it works on ephemeral hosting (Render, Railway, etc.).
- The frontend has been verified to typecheck cleanly (`tsc -b`) and build for production (`vite build`); the backend has been verified to load cleanly end-to-end (all routes/models/services resolve).

## 📦 Suggested Deployment

- **Backend:** Render / Railway / an AWS EC2 instance (Node + MongoDB Atlas)
- **Frontend:** Vercel / Netlify (set `VITE_API_URL` to your deployed backend URL)
- **Database:** MongoDB Atlas free tier
- **Docker/GitHub Actions:** optional — add a `Dockerfile` per service and a CI workflow that runs `npm ci && npm run build` on push, if your internship requires it.
