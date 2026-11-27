# Support Ticket Management System – Backend

REST API for a mini helpdesk: users raise support tickets, administrators triage and resolve them.
Built with **Node.js, Express, TypeScript, MongoDB (Mongoose)** and JWT authentication.

## Features
* Register / login with **JWT** (httpOnly cookie *or* `Authorization: Bearer`), roles **user** and **admin**
* Tickets: create, list, view, edit & delete (while `open`), status tracking, comments
* Admin: all tickets, filter by status / priority / category / requester / assignee, update status & priority,
  assign tickets, ticket details **with comments**, user management, dashboard statistics
* **Event-driven workflow** (`ticket.created`, `updated`, `status_changed`, `priority_changed`, `assigned`,
  `comment_added`, `resolved`, `deleted`) → **activity log** + **in-app notifications**
* Search, sorting, pagination, input validation, rate limiting, Docker support, automated tests

## Quick start
```bash
npm install
cp .env.example .env        # set MONGODB_URI and a 32+ char JWT_SECRET
npm run create-admin        # creates the first admin from ADMIN_* variables
npm run dev                 # http://localhost:5000/api/health
```
Docker: `JWT_SECRET=<32+ chars> docker compose up --build` (then run `create-admin` inside the api container).

| Script | Purpose |
|---|---|
| `npm run dev` | start with auto-reload (tsx) |
| `npm run build && npm start` | compile to `dist/` and run |
| `npm test` | integration tests (Jest + Supertest) |
| `npm run create-admin` | create the admin account (`create-admin:prod` after build) |

Tests use an in-memory MongoDB by default; set `MONGODB_TEST_URI` to use an existing server instead.

## Architecture
```
src/
  config/       env validation (zod), database connection
  constants/    roles, statuses, priorities, status-transition map, event names
  models/       Mongoose schemas: user, ticket, comment, activity-log, notification
  validators/   zod schemas for body / query / params
  middleware/   auth (JWT), role guard, validation, rate limit, error handling
  routes/       HTTP routing only
  controllers/  thin: read request -> call service -> send response
  services/     business rules + authorization scope (the real logic)
  events/       event bus + listeners (activity log, notifications)
  scripts/      createAdmin
```
Request flow: `route → validate → protect → authorize → controller → service → model`; every failure is an
`AppError` handled in one global error middleware, so all responses share the shape
`{ success, message, data?, errors? }`.

### Event handling
Services publish an event **after** the database write succeeds. Listeners subscribe independently:
* **Activity log listener** – stores an immutable entry per event (`GET /api/tickets/:id/activities`)
* **Notification listener** – new ticket → admins; admin reply / status / priority / resolved / assignment → requester;
  requester comment → assigned admin (or all admins). The actor is never notified about their own action.

A failing listener is caught and logged; it can never fail the user's request. The bus is in-process
(`EventEmitter`) – for multi-instance production use, swap the bus for Redis/BullMQ/SQS without touching services.

## API overview (base `/api`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | create a user account (role is always `user`) |
| POST | `/auth/login` | public | login; sets cookie, returns `token` |
| GET / POST | `/auth/me` · `/auth/logout` | auth | current user · clear cookie |
| POST | `/tickets` | user | create ticket |
| GET | `/tickets` | user | my tickets – `status, priority, category, search, page, limit, sortBy, order` |
| GET | `/tickets/:id` | owner / admin | ticket details |
| PATCH / DELETE | `/tickets/:id` | owner | edit / delete (only while `open`) |
| GET / POST | `/tickets/:id/comments` | owner / admin | list / add comment |
| GET | `/tickets/:id/activities` | owner / admin | activity log |
| GET | `/notifications` · PATCH `/notifications/:id/read` · PATCH `/notifications/read-all` | auth | in-app notifications |
| GET | `/admin/dashboard` | admin | statistics (counts, by status/priority/category, avg resolution & first-response time) |
| GET | `/admin/tickets` | admin | all tickets + filters (`status, priority, category, createdBy, assignedTo, search`) |
| GET | `/admin/tickets/:id` | admin | ticket details **with comments** |
| PATCH | `/admin/tickets/:id/status` · `/priority` · `/assign` | admin | manage ticket |
| GET | `/admin/users` · PATCH `/admin/users/:id/status` | admin | list / (de)activate users |

Postman collection: `docs/postman_collection.json` (login requests store the JWT in collection variables).
Database design: `docs/DATABASE.md`.

Ticket status rules: `open → in_progress / resolved / closed`, `in_progress → open / resolved / closed`,
`resolved → open / in_progress / closed`, `closed → open`. Anything else returns `400`.

## Security notes
* bcrypt (cost 12) hashing in a model hook; password never selected or serialised
* JWT pinned to HS256, 1 day expiry, user re-loaded each request (deactivated users are locked out immediately)
* Role + ownership checks live in the service layer; other users' tickets return `404` (no existence leak)
* zod validation strips unknown fields (no mass assignment) and rejects object payloads (NoSQL injection)
* Search input is regex-escaped; `helmet`, CORS allow-list, 10 kb JSON limit, global + stricter auth rate limiting
* Login does a dummy bcrypt compare for unknown emails (no user enumeration through timing)
* No `urlencoded` parser + cookie auth → no cross-site form posts

## Deployment notes
* Set `NODE_ENV=production`, `MONGODB_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL` (your frontend origin).
* Frontend and API on **different domains**: cookies need `SameSite=None; Secure` – this is the production default
  (`COOKIE_SAME_SITE` overrides it) and requires HTTPS.
* Behind a proxy (Render, Railway, Nginx) `trust proxy` is enabled automatically in production.
* Atlas `querySrv` DNS errors on some networks: set `DNS_SERVERS=8.8.8.8,8.8.4.4`.

## Possible next steps
Email notifications via a third listener (e.g. Nodemailer), WebSocket push for notifications, refresh tokens,
file attachments, fixed category list.
