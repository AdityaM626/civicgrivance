# P20 — Municipal Civic Complaint & Grievance Management System

> **Course Project:** 5th Semester CIA-3 — Advanced JavaScript Backend Frameworks (Node.js & Express JS)

---

## 📌 Project Overview

The **Municipal Civic Complaint & Grievance Management System** is a robust civic-tech backend solution built with Node.js, Express, and MongoDB. The system enables citizens to report civic grievances (e.g., road damage, street lighting, waste management issues), automatically routes complaints to responsible municipal departments based on category and ward, enforces Service Level Agreements (SLA) with automatic escalation rules, tracks resolution notes/proofs, manages citizen feedback and reopening workflows, provides public status tracking by reference code, and offers comprehensive administrative reporting powered by MongoDB aggregation pipelines.

---

## 🛠️ Technology Stack

- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB
- **ODM (Object Data Modeling):** Mongoose
- **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs
- **Rate Limiting:** In-memory Rate Limiter Middleware
- **Validation:** express-validator
- **Environment Management:** dotenv
- **Cross-Origin Handling:** CORS

---

## 📊 Admin & Department Reporting Architecture

The reporting module uses **MongoDB Aggregation Pipelines** to group, filter, and analyze complaint metrics directly within the database engine.

> **Technical Note for Examination / Viva:**
> The reporting module uses MongoDB aggregation pipelines to group and analyze complaint data directly within the database. This reduces unnecessary data transfer to the Node.js application layer and provides efficient calculations for ward-wise, department-wise, category-wise, SLA, escalation, and resolution metrics.

### Aggregation Operators Used
- `$match`: Efficient initial index-backed filtering by date range (`createdAt`), department (`departmentId`), ward, category, priority, and status.
- `$group`: Statistical aggregation grouped by ward (`$ward`), department (`$departmentId`), category (`$category`), status (`$status`), priority (`$priority`), or date periods (`$dateToString`).
- `$facet`: Single-pass multi-dimensional metric computation for high-level dashboard summaries (`overview`, `escalations`, `resolution`).
- `$lookup`: Safe left-outer joins with `departments` and `resolutionproofs` collections.
- `$sort` & `$project`: Output ordering and strict public/admin field projection.

### Access Control & RBAC
- **`ADMIN`:** System-wide access to all 10 reports. Can filter by any department ID, ward, category, status, priority, or date range.
- **`OFFICER`:** Strictly restricted to reporting metrics for their own department (`req.user.departmentId`). If an officer attempts to pass a different department ID query parameter, the API returns `HTTP 403 Forbidden`. Department scope is automatically enforced if no department filter is specified.
- **`CITIZEN` / Unauthenticated:** Prohibited from accessing reporting endpoints (`HTTP 403 Forbidden` / `HTTP 401 Unauthorized`).

---

## 🔍 Public Complaint Status Lookup & Data Privacy

Citizens and public users can track the progress of any complaint without authenticating by providing its reference code (e.g., `CIV-2026-123456`).

### Endpoint
```http
GET /api/v1/public/complaints/:referenceCode
```

### Rate Limiting & Protection
- **Rate Limit:** 100 requests per 15-minute window per IP address (`HTTP 429 Too Many Requests` when exceeded).
- **Format Validation:** Express-validator enforces `CIV-YYYY-XXXXXX` syntax (`HTTP 400 Bad Request`).
- **NotFound Handling:** Returns standard `HTTP 404 Not Found` for non-existent reference codes.

### Strict Data Privacy Guarantee
The public tracker relies on a dedicated DTO (`formatPublicComplaint`) that strictly strips all sensitive personal and internal operational details:
- **Hidden Information:** Citizen identity/contact info, street address/lat-long coordinates, officer identity/contact info, user database IDs, internal escalation levels/reasons, and internal remarks.
- **Exposed Public Fields:** `referenceCode`, `category`, `ward`, `priority`, `status`, `statusLabel`, `statusDescription`, `department` (name only), `sla` status (`ON_TIME`/`OVERDUE`), `resolution` (status & resolvedAt), `filedAt`, `lastUpdatedAt`, and public `timeline` (`status`, `statusLabel`, `timestamp`).

---

## 🔄 Complaint Lifecycle & Status Workflow

```text
FILED ──► ASSIGNED ──► IN_PROGRESS ──► RESOLVED ──► CLOSED
                             │            │          │
                             │            └───► REOPENED
                             │                     │
                             └─────────────────────┘
```

- **`FILED` ➡️ `ASSIGNED`:** Triggered automatically when an Admin assigns a field officer to the complaint.
- **`ASSIGNED` ➡️ `IN_PROGRESS`:** Transitioned by the assigned officer when field work commences.
- **`IN_PROGRESS` ➡️ `RESOLVED`:** Transitioned by the assigned officer upon submitting resolution proof (notes & photo URLs).
- **`RESOLVED` ➡️ `CLOSED`:** Transitioned by the citizen owner accepting the resolution or closing the complaint.
- **`RESOLVED`/`CLOSED` ➡️ `REOPENED`:** Transitioned by the citizen owner if dissatisfied with the resolution (requires `reopenReason` >= 10 characters).
- **`REOPENED` ➡️ `IN_PROGRESS`:** Transitioned by the officer resuming work on a reopened complaint.

---

## ⏳ SLA Monitoring & Reopen SLA Invariance

Every complaint receives an unalterable **Service Level Agreement (SLA)** deadline calculated upon creation (`slaDueAt = createdAt + slaHours`).

- **SLA Clock Invariance:** Assigning/reassigning an officer or reopening a complaint does **NOT** reset the original SLA clock (`slaDueAt`).
- **Level 1 Escalation:** Generated automatically if unresolved past `slaDueAt`.
- **Level 2 Escalation:** Generated automatically if unresolved 24 hours past Level 1 Escalation.
- **Auto-Resolution on Resolution:** Resolving a complaint automatically marks open escalation records as `RESOLVED`.

---

## 🌐 API Endpoint Reference

| Method | Endpoint | Role Allowed | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System health & timestamp check |
| `GET` | `/api/v1/public/complaints/:referenceCode` | Public | Public complaint status tracking (No Auth) |
| `POST` | `/api/v1/auth/register` | Public | Register new Citizen account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue JWT token |
| `GET` | `/api/v1/auth/me` | All Roles | Fetch current user profile |
| `PATCH` | `/api/v1/auth/me` | All Roles | Update profile details (name, phone, ward) |
| `PATCH` | `/api/v1/auth/change-password` | All Roles | Change account password |
| `POST` | `/api/v1/departments` | `ADMIN` | Create new municipal department |
| `GET` | `/api/v1/departments` | Authenticated | List active municipal departments |
| `GET` | `/api/v1/departments/:id` | Authenticated | Get department details by ID |
| `PATCH` | `/api/v1/departments/:id` | `ADMIN` | Update department metadata |
| `PATCH` | `/api/v1/departments/:id/deactivate` | `ADMIN` | Soft-deactivate department |
| `POST` | `/api/v1/departments/:id/categories` | `ADMIN` | Add category SLA mapping |
| `PATCH` | `/api/v1/departments/:id/categories/:categoryId` | `ADMIN` | Update category SLA mapping |
| `PATCH` | `/api/v1/departments/:id/categories/:categoryId/deactivate` | `ADMIN` | Soft-deactivate category mapping |
| `POST` | `/api/v1/complaints` | `CITIZEN` | File new civic complaint |
| `GET` | `/api/v1/complaints/my` | `CITIZEN` | View own complaints with pagination & filters |
| `GET` | `/api/v1/complaints/:id` | `CITIZEN`/`ADMIN` | View complaint details, timeline, feedback & resolution proofs |
| `POST` | `/api/v1/complaints/:complaintId/feedback` | `CITIZEN` | Submit rating & feedback for resolved/closed complaint |
| `GET` | `/api/v1/complaints/:complaintId/feedback` | Authenticated | Retrieve feedback record for a complaint |
| `POST` | `/api/v1/complaints/:complaintId/reopen` | `CITIZEN` | Reopen resolved/closed complaint with reason |
| `POST` | `/api/v1/complaints/:complaintId/close` | `CITIZEN` | Explicitly close resolved complaint |
| `PATCH` | `/api/v1/assignments/complaints/:complaintId` | `ADMIN` | Assign complaint to officer |
| `PATCH` | `/api/v1/assignments/complaints/:complaintId/reassign` | `ADMIN` | Reassign complaint to new officer |
| `GET` | `/api/v1/assignments/departments/:departmentId/officers` | `ADMIN` | List officers in department |
| `GET` | `/api/v1/officer/complaints` | `OFFICER` | View assigned complaint queue |
| `GET` | `/api/v1/officer/complaints/:id` | `OFFICER` | View assigned complaint details & timeline |
| `PATCH` | `/api/v1/complaints/:complaintId/status` | `OFFICER` | Transition status (`IN_PROGRESS`/`RESOLVED`) |
| `PATCH` | `/api/v1/complaints/:complaintId/resolve` | `OFFICER` | Submit resolution proof notes/photos & resolve |
| `POST` | `/api/v1/admin/sla/check` | `ADMIN` | Manually trigger SLA breach check |
| `GET` | `/api/v1/admin/escalations` | `ADMIN` | View escalation records with level & status filters |
| `GET` | `/api/v1/admin/escalations/:id` | `ADMIN` | View escalation details |
| `GET` | `/api/v1/admin/complaints` | `ADMIN` | Operational view of all complaints |
| `GET` | `/api/v1/admin/complaints/:id` | `ADMIN` | Operational view of complaint details & timeline |
| `GET` | `/api/v1/reports/overview` | `ADMIN`/`OFFICER` | High-level dashboard summary metrics |
| `GET` | `/api/v1/reports/wards` | `ADMIN`/`OFFICER` | Ward-wise complaint breakdown |
| `GET` | `/api/v1/reports/departments` | `ADMIN`/`OFFICER` | Department-wise performance metrics |
| `GET` | `/api/v1/reports/categories` | `ADMIN`/`OFFICER` | Category complaint distribution |
| `GET` | `/api/v1/reports/status` | `ADMIN`/`OFFICER` | Status distribution breakdown |
| `GET` | `/api/v1/reports/priorities` | `ADMIN`/`OFFICER` | Priority distribution breakdown |
| `GET` | `/api/v1/reports/sla` | `ADMIN`/`OFFICER` | SLA compliance & breach metrics |
| `GET` | `/api/v1/reports/escalations` | `ADMIN`/`OFFICER` | Escalation level & status statistics |
| `GET` | `/api/v1/reports/resolution` | `ADMIN`/`OFFICER` | Resolution rates & average resolution times |
| `GET` | `/api/v1/reports/trends` | `ADMIN`/`OFFICER` | Time-trend analysis (daily, weekly, monthly) |

*Note: `OFFICER` role access is automatically restricted to metrics within their assigned department.*

---

## 📂 Project Structure

```text
municipal-civic-grievance/
│
├── src/
│   ├── config/
│   │   └── db.js                       # Mongoose database connection setup
│   │
│   ├── controllers/
│   │   ├── admin.controller.js         # Admin operational & escalation handlers
│   │   ├── assignment.controller.js   # Officer assignment handlers
│   │   ├── auth.controller.js          # Authentication handlers
│   │   ├── complaint.controller.js     # Citizen complaint filing, status, reopen & close handlers
│   │   ├── department.controller.js    # Department & category CRUD handlers
│   │   ├── feedback.controller.js      # Citizen feedback handlers
│   │   ├── health.controller.js        # Health check endpoint controller
│   │   ├── officer.controller.js       # Officer queue handlers
│   │   ├── publicComplaint.controller.js # Public unauthenticated status lookup controller
│   │   ├── report.controller.js       # Analytics & aggregation reporting controllers
│   │   └── resolution.controller.js    # Officer resolution proof handlers
│   │
│   ├── jobs/
│   │   ├── index.js                    # Jobs initialization manager
│   │   └── slaEscalation.job.js        # SLA breach background scheduler (5m interval)
│   │
│   ├── models/
│   │   ├── User.js                     # User schema (Citizen, Officer, Admin)
│   │   ├── Department.js               # Department & categories schema
│   │   ├── Complaint.js                # Civic complaint core schema
│   │   ├── StatusHistory.js            # Audit log for status lifecycle
│   │   ├── ResolutionProof.js          # Multi-cycle resolution proof notes & image links
│   │   ├── Feedback.js                 # Citizen rating & feedback schema
│   │   └── Escalation.js               # SLA breach escalation schema
│   │
│   ├── routes/
│   │   ├── admin.routes.js             # Admin endpoints (/api/v1/admin)
│   │   ├── assignment.routes.js        # Assignment endpoints (/api/v1/assignments)
│   │   ├── auth.routes.js              # Authentication endpoints (/api/v1/auth)
│   │   ├── complaint.routes.js         # Complaint endpoints (/api/v1/complaints)
│   │   ├── department.routes.js        # Department endpoints (/api/v1/departments)
│   │   ├── health.routes.js            # Health route definitions
│   │   ├── officer.routes.js           # Officer queue endpoints (/api/v1/officer)
│   │   ├── publicComplaint.routes.js   # Public status tracking route definitions
│   │   ├── report.routes.js            # Reporting & analytics route definitions (/api/v1/reports)
│   │   └── index.js                    # API v1 Central router
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT authentication
│   │   ├── rateLimit.middleware.js     # Rate limiting middleware for public endpoints
│   │   ├── role.middleware.js          # Role-based authorization middleware (RBAC)
│   │   ├── validation.middleware.js    # express-validator result handler
│   │   └── error.middleware.js         # Centralized error & 404 handler
│   │
│   ├── services/
│   │   ├── admin.service.js            # Admin operational complaint logic
│   │   ├── assignment.service.js       # Officer assignment & reassignment logic
│   │   ├── auth.service.js             # Auth business logic, bcrypt & JWT
│   │   ├── complaint.service.js        # Complaint filing, timeline, reopen & close logic
│   │   ├── department.service.js       # Department & category business logic
│   │   ├── feedback.service.js         # Citizen feedback submission & retrieval logic
│   │   ├── officer.service.js          # Officer assigned queue logic
│   │   ├── publicComplaint.service.js  # Public complaint status lookup logic
│   │   ├── report.service.js           # MongoDB aggregation pipelines for reporting
│   │   ├── resolution.service.js       # Multi-cycle resolution proof & auto-close logic
│   │   ├── routing.service.js          # Automatic complaint routing engine
│   │   ├── sla.service.js              # SLA calculation & escalation engine
│   │   └── status.service.js           # Centralized status transition matrix
│   │
│   ├── validators/
│   │   ├── assignment.validator.js     # Assignment validation schema
│   │   ├── auth.validator.js           # Registration, login & profile schemas
│   │   ├── complaint.validator.js      # Complaint filing validation schema
│   │   ├── department.validator.js     # Department & category validation schemas
│   │   ├── feedback.validator.js       # Citizen feedback validation schema
│   │   ├── public.validator.js         # Public reference code validation schema
│   │   ├── report.validator.js         # Date & query filter validation schemas for reports
│   │   ├── reopen.validator.js         # Reopen complaint validation schema
│   │   ├── resolution.validator.js     # Resolution proof validation schema
│   │   ├── status.validator.js         # Status update validation schema
│   │   └── index.js                    # Validators export index
│   │
│   ├── utils/
│   │   ├── referenceCode.js            # CIV-YYYY-XXXXXX generator
│   │   ├── publicComplaintFormatter.js # Privacy-preserving public DTO formatter
│   │   ├── reportFilters.js            # MongoDB $match builder & percentage rounding helpers
│   │   ├── seed.js                     # Environment database seed script
│   │   ├── verifyModels.js             # Model compilation test utility
│   │   ├── verifyAuth.js               # Phase 3 Auth verification test suite
│   │   ├── verifyPhase4.js             # Phase 4 Routing & Complaint test suite
│   │   ├── verifyPhase5.js             # Phase 5 Workflow & Assignment test suite
│   │   ├── verifyPhase6.js             # Phase 6 SLA & Resolution test suite
│   │   ├── verifyPhase7.js             # Phase 7 Feedback, Closure & Reopen test suite
│   │   ├── verifyPhase8.js             # Phase 8 Public Status Tracking test suite
│   │   └── verifyPhase9.js             # Phase 9 Reporting & Analytics test suite
│   │
│   └── app.js                          # Express app configuration & middleware setup
│
├── tests/                              # Unit & integration tests
│
├── postman/
│   └── Municipal-Civic-Grievance.postman_collection.json # Postman API collection
│
├── .env                                # Local environment secrets (Git-ignored)
├── .env.example                        # Template for required environment variables
├── .gitignore                          # Git ignored patterns
├── package.json                        # Dependencies and scripts
├── server.js                           # Application entry point & server listener
└── README.md                           # Project documentation
```

---

## 🚀 Execution Commands

### Development Server:
```bash
npm run dev
```

### Run Phase 9 Automated Verification:
```bash
node src/utils/verifyPhase9.js
```
