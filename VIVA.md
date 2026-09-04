# P20 Municipal Civic Complaint & Grievance System — Academic Viva Guide

> **Course:** 5th Semester CIA-3 — Advanced JavaScript Backend Frameworks (Node.js & Express.js)  
> **Backend Architecture & Examination Q&A Guide**

---

## 📌 Section 1: Core Technology Choices

### Q1: Why Node.js for this backend application?
**Answer:** Node.js uses an asynchronous, single-threaded, non-blocking I/O event loop powered by the V8 JavaScript engine. For a civic grievance management system handling concurrent requests (filing complaints, status tracking, public lookups, report generation), Node.js provides high throughput and low latency without blocking worker threads.

### Q2: Why Express.js as the web framework?
**Answer:** Express.js is a minimalist and flexible web application framework that provides robust routing, middleware pipeline integration, error handling, and request/response manipulation while maintaining an unopinionated structure ideal for standard RESTful API implementations.

### Q3: Why MongoDB as the database?
**Answer:** MongoDB is a document-oriented NoSQL database that stores data in flexible BSON format. Civic complaint data (categories, ward details, location coordinates, status timelines, resolution proof arrays) varies across complaints and benefits from document embedding and indexing without requiring complex relational JOINs for core reads.

### Q4: Why Mongoose for ODM (Object Data Modeling)?
**Answer:** Mongoose provides strict schema definition, field type casting, built-in validation rules, lifecycle hooks, virtuals, static methods, and query building over MongoDB BSON documents. It prevents corrupted data insertion while allowing flexible document queries.

### Q5: Why JSON Web Tokens (JWT) for authentication?
**Answer:** JWT allows stateless, decentralized authentication. Upon login, the server signs a payload (`userId`, `role`) with a secret key (`JWT_SECRET`). Clients present this token in the `Authorization: Bearer <token>` header, eliminating session state storage in server memory and scaling effortlessly across microservices.

### Q6: Why bcryptjs for password hashing?
**Answer:** bcryptjs implements the Blowfish-based adaptive key derivation function (`bcrypt`). It incorporates a random salt to protect against rainbow table attacks and configurable work factor rounds to make brute-force password cracking computationally prohibitive.

---

## 📌 Section 2: Architecture & Design Patterns

### Q7: Explain the MVC (Model-View-Controller) architecture in this project.
**Answer:**
- **Model (`src/models/`):** Defines database schemas, field constraints, types, and indexes (User, Department, Complaint, StatusHistory, ResolutionProof, Feedback, Escalation).
- **Controller (`src/controllers/`):** Handles HTTP request parameter extraction, status codes, and HTTP response formatting.
- **Service Layer (`src/services/`):** Encapsulates core business logic, database queries, transactions, and domain rules.
- **Routes (`src/routes/`):** Maps HTTP methods and URI paths to middleware and controller functions.

### Q8: Why introduce a dedicated Service Layer separate from Controllers?
**Answer:** Keeping business logic inside services makes controllers thin and focused purely on HTTP contracts. Services can be reused across different routes, background jobs (e.g., SLA escalation job), or automated test suites without mocking HTTP request/response objects.

### Q9: How is centralized error handling implemented?
**Answer:** Express middleware `src/middleware/error.middleware.js` catches errors passed via `next(error)`. It handles standard operational errors (`error.statusCode`), Mongoose validation errors (`ValidationError`), duplicate key errors (code `11000`), and JWT errors, returning a standardized `{ success: false, message: "..." }` response without leaking stack traces.

### Q10: How does server-side request validation work?
**Answer:** Using `express-validator` middleware rules (`src/validators/`). Incoming requests pass through validation chains before reaching controllers. If validation fails, `validation.middleware.js` returns `HTTP 400 Bad Request` with structured error messages. Client-side input is never trusted.

---

## 📌 Section 3: Domain Mechanics & Business Logic

### Q11: How does the Automatic Complaint Routing Engine work?
**Answer:** When a citizen files a complaint with a `category` name, `routing.service.js` performs a case-insensitive lookup against active department categories (`Department.findOne({ 'categories.name': category, 'categories.isActive': true })`). It maps the complaint to the matching `departmentId` and extracts the SLA hours (`slaHours`), ensuring complaints are automatically directed to the correct municipal body.

### Q12: How are unique Complaint Reference Codes generated?
**Answer:** `src/utils/referenceCode.js` generates reference codes in the format `CIV-YYYY-XXXXXX` (e.g., `CIV-2026-123456`), where `YYYY` is the current year and `XXXXXX` is a random 6-digit number. It verifies uniqueness against the indexed `Complaint.referenceCode` collection before returning.

### Q13: How is SLA calculated, and why is the SLA clock invariant?
**Answer:** Upon filing, `slaDueAt` is set to `Date.now() + slaHours * 3600000`. The SLA clock remains **invariant** (never reset during officer reassignment, status changes, or reopening) to preserve original civic service accountability and prevent artificial SLA compliance padding.

### Q14: How does the automatic SLA Escalation engine operate?
**Answer:** A background job scheduler (`slaEscalation.job.js`) runs periodically. It queries unresolved complaints (`status` in `FILED`, `ASSIGNED`, `IN_PROGRESS`) where `slaDueAt < Date.now()`.
- **Level 1 Escalation:** Created when past SLA deadline and no open escalation exists.
- **Level 2 Escalation:** Created when Level 1 remains open past grace threshold (24h).
- Idempotency checks prevent duplicate escalation records. When an officer resolves the complaint, open escalation records are automatically closed (`status: 'RESOLVED'`).

### Q15: How does the Status Transition Matrix enforce workflow integrity?
**Answer:** `src/services/status.service.js` maintains a central transition matrix:
```javascript
TRANSITION_MATRIX = {
  FILED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS']
};
```
Illegal transitions (e.g., `FILED ➡️ CLOSED` or `ASSIGNED ➡️ RESOLVED`) are rejected with `HTTP 400 Bad Request`.

### Q16: How are multiple Resolution Cycles supported when complaints are reopened?
**Answer:** `ResolutionProof` model includes a `resolutionCycle` integer field (Cycle 1, Cycle 2) with compound unique index `{ complaintId: 1, resolutionCycle: 1 }`. When an officer resolves a reopened complaint, a new `ResolutionProof` record is appended with incremented `resolutionCycle`, preserving complete historical resolution notes and photos.

---

## 📌 Section 4: Security, RBAC & Data Privacy

### Q17: How is Role-Based Access Control (RBAC) enforced?
**Answer:** `src/middleware/role.middleware.js` defines `authorizeRoles(...allowedRoles)`. After JWT authentication verifies `req.user`, the role middleware checks if `allowedRoles.includes(req.user.role)`. Unauthorized roles receive `HTTP 403 Forbidden`.

### Q18: How is Officer Department Isolation secured?
**Answer:** Officers can only access complaints and reports within their assigned department (`req.user.departmentId`). Controllers and services extract `departmentId` from the authenticated JWT user object, rejecting attempts by an officer to pass another department's ID (`HTTP 403 Forbidden`). Client-supplied user/department IDs are never trusted.

### Q19: How does the Public Complaint Status Lookup endpoint guarantee data privacy?
**Answer:** `GET /api/v1/public/complaints/:referenceCode` requires no JWT. To prevent information leakage, `publicComplaintFormatter.js` constructs a strict public DTO that strips citizen personal info, officer personal info, street address/lat-long coordinates, database ObjectIds, internal escalation levels/reasons, and internal remarks. It returns only public-safe status, ward, category, department name, SLA status, and timeline.

### Q20: What security hardening measures are in place?
**Answer:**
- HTTP Security Headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `HSTS`).
- In-memory Rate Limiting Middleware on public lookup endpoints (100 req / 15 min / IP).
- Payload size limits (`limit: '10mb'`).
- Indexed reference lookups to prevent enumeration query injection.

---

## 📌 Section 5: Database & Reporting Analytics

### Q21: Why separate `StatusHistory` into its own collection instead of embedding an array in `Complaint`?
**Answer:** Embedding status arrays inside complaint documents can cause document growth issues (unbounded array anti-pattern) and hinders high-performance global querying/indexing across status audit events. A standalone `StatusHistory` collection allows indexing on `complaintId` and `createdAt` for fast timeline lookups.

### Q22: Why use MongoDB Aggregation Pipelines for reporting?
**Answer:** Processing statistical reports directly inside MongoDB using aggregation pipelines (`$match`, `$group`, `$facet`, `$lookup`, `$sort`, `$project`) executes data processing at the database layer. It eliminates sending thousands of raw complaint documents over the network to Node.js memory, dramatically improving response speed and scalability.

### Q23: Explain how `$facet` is used in the Overview Report pipeline.
**Answer:** `$facet` allows executing multiple sub-pipelines in a single aggregation pass over the filtered dataset. It computes `totalComplaints`, status counts (`filed`, `assigned`, `inProgress`, `resolved`, `closed`, `reopened`), `overdue` counts, and `escalated` counts simultaneously, returning a single document containing all dashboard metrics.

### Q24: How is Average Resolution Time calculated?
**Answer:** In `report.service.js`, the resolution report pipeline joins `Complaint` documents with `ResolutionProof` (cycle 1 `resolvedAt`) using `$lookup`, computes the duration `$subtract: ['$resolvedAt', '$createdAt']` in milliseconds, averages the duration across resolved complaints using `$avg`, and converts milliseconds to hours rounded to 2 decimal places.

### Q25: How does the database handle empty datasets in reports?
**Answer:** Pipelines handle zero-match queries gracefully by using `$ifNull` operators and default object fallbacks (`totalComplaints: 0`, `resolutionRate: 0`, `complianceRate: 0`), returning structured valid JSON reports instead of null pointer exceptions.
