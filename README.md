# Support Ticket Management System

A full-stack **Support Ticket Management System** built with Next.js, React, TypeScript, Node.js, Express.js, and MongoDB. The application provides a centralized platform for managing support requests, tracking ticket progress, communicating through comments, and monitoring activities.

It features role-based access for Users and Administrators, JWT authentication, ticket lifecycle management, and an event-driven activity logging system.

## Features

### User Management
- User registration and login with JWT authentication.
- Role-based access control for Users and Administrators.
- Protected routes and authenticated API requests.

### Ticket Management
- Create, view, update, and delete support tickets.
- Organize tickets by category and priority.
- Track ticket statuses: Open, In Progress, Resolved, and Closed.
- Search, filter, and paginate ticket listings.
- View detailed ticket information.

### Comments & Activity Tracking
- Add comments to support tickets.
- View ticket conversation history.
- Automatically record ticket-related activities.
- Track ticket creation, updates, status changes, priority changes, comments, and resolution.

### Admin Dashboard
- Dashboard with ticket and user statistics.
- View and manage tickets across all users.
- Update ticket status and priority.
- Search and filter tickets.
- Access ticket details, comments, and activity history.
- View registered users with search and pagination.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Node.js, Express.js 4, TypeScript |
| Database | MongoDB, Mongoose 8 |
| Authentication | JSON Web Token (JWT), bcryptjs |
| API Communication | REST API, Axios |
| Validation | Zod |
| Security | Helmet, CORS, Express Rate Limit |
| Event Handling | Node.js EventEmitter |
| Testing | Jest, Supertest, MongoDB Memory Server |
| Development Tools | ESLint, tsx, TypeScript |

## Project Structure

```text
support-ticket-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── errors/
│   │   ├── events/
│   │   │   └── listeners/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validators/
│   ├── tests/
│   ├── docs/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── tickets/
│   │   │   │   │   └── [id]/
│   │   │   │   └── users/
│   │   │   ├── dashboard/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── tickets/
│   │   │       ├── create/
│   │   │       └── [id]/
│   │   ├── components/
│   │   │   └── providers/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   └── package.json
│
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 18 or later
- npm
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd support-ticket-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open another terminal from the project root:

```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Create the required environment files.

**Backend: `backend/.env`**

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:3000
```

**Frontend: `frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Make sure to configure any additional environment variables required by your implementation. Never commit secrets or credentials to GitHub.

### 5. Create an Admin Account

From the backend directory:

```bash
npm run create-admin
```

Follow the prompts or configuration expected by the admin creation script.

### 6. Start the Backend

From the backend directory:

```bash
npm run dev
```

The backend API will run at:

`http://localhost:5000`

### 7. Start the Frontend

From the frontend directory:

```bash
npm run dev
```

The frontend will be available at:

`http://localhost:3000`

## Available Scripts

### Backend

Run these commands from the `backend` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start development server with automatic restart |
| `npm run build` | Compile TypeScript into JavaScript |
| `npm start` | Start the production server |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run Jest tests |
| `npm run create-admin` | Create an administrator account |
| `npm run create-admin:prod` | Create an administrator using compiled code |

### Frontend

Run these commands from the `frontend` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint checks |

## API Documentation

**Base URL:**

```text
http://localhost:5000/api
```

### Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API status |
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/tickets` | Get user tickets |
| POST | `/tickets` | Create a ticket |
| GET | `/tickets/:id` | Get ticket details |
| PATCH | `/tickets/:id` | Update a ticket |
| DELETE | `/tickets/:id` | Delete a ticket |
| GET | `/tickets/:id/comments` | Get ticket comments |
| POST | `/tickets/:id/comments` | Add a comment |
| GET | `/tickets/:id/activities` | Get ticket activity history |
| GET | `/admin/dashboard` | Get dashboard statistics |
| GET | `/admin/tickets` | Get all tickets |
| GET | `/admin/users` | Get registered users |
| GET | `/admin/tickets/:id` | Get ticket details as admin |
| PATCH | `/admin/tickets/:id/status` | Update ticket status |
| PATCH | `/admin/tickets/:id/priority` | Update ticket priority |

All endpoints are relative to the `/api` base path. Protected endpoints require authentication and appropriate authorization.

## Security

- JWT-based authentication.
- Password hashing using bcryptjs.
- Role-based authorization.
- Request validation using Zod.
- Secure HTTP headers using Helmet.
- Configurable CORS policy.
- API rate limiting.
- Protected user and administrative operations.

## Event-Driven Activity Logging

The application uses Node.js EventEmitter to handle ticket-related events.

When an action occurs, the application publishes an event. Registered listeners process the event and save the corresponding activity record in MongoDB.

Supported events include:

- `ticket.created`
- `ticket.updated`
- `ticket.status_changed`
- `ticket.priority_changed`
- `ticket.comment_added`
- `ticket.resolved`
- `ticket.deleted`

This provides an activity history for tracking ticket changes and understanding ticket progress.

## Testing

The backend testing setup uses:

- Jest for test execution.
- Supertest for HTTP endpoint testing.
- MongoDB Memory Server for isolated database testing.

Run backend tests:

```bash
cd backend
npm test
```

Run backend type checking:

```bash
npm run typecheck
```

## Future Enhancements

- Real-time notifications using WebSockets.
- Email notifications for ticket updates.
- Ticket assignment to support agents.
- Advanced analytics and reporting.
- CI/CD integration and automated deployment.

## Author

**Rithish Kurapati**

GitHub: [rithish72](https://github.com/rithish72)
