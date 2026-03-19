# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VerticalLog** — A fullstack climbing logbook app (school project). Users can browse climbing sites/routes and log their ascents with grades, feelings, and stats.

## Dev Commands

### Database (required first)
```bash
docker-compose up -d   # Start PostgreSQL on port 5432
```

### Backend (`/backend`)
```bash
npm run dev     # ts-node-dev, hot reload, http://localhost:3001
npm run build   # tsc → dist/
npm start       # node dist/index.js
```

### Frontend (`/frontend`)
```bash
npm run dev     # Vite dev server, http://localhost:5173
npm run build   # tsc + vite build
npm run preview # Preview production build
```

No test suite exists.

## Architecture

### Stack
- **Backend:** Node.js + Express + TypeScript, `pg` for raw SQL queries, `bcrypt` + JWT auth
- **Frontend:** React 18 + TypeScript + Vite, React Router v6, Axios, Chart.js
- **DB:** PostgreSQL 16 (Docker), schema in `backend/src/migrations/init.sql`

### Auth Flow
JWT stored in localStorage. Token payload: `{ id, username, role }`, 7-day expiry.

- `backend/src/middleware/auth.ts` — two middlewares:
  - `authenticateToken`: verifies JWT, attaches `req.user`
  - `requireRole(role)`: cascading role check (user=1, expert=2, admin=3)
- `frontend/src/context/AuthContext.tsx` — manages auth state, restores token from localStorage on mount
- `frontend/src/api.ts` — Axios instance with Bearer token interceptor
- `frontend/src/components/PrivateRoute.tsx` — guards protected pages

### Role Permissions
| Action | Min role |
|---|---|
| Browse sites & routes | public |
| Log ascents | user |
| Create/edit sites & routes | expert |
| Delete sites, routes | admin |

### Backend Routes
All mounted under `/api/`:
- `auth` — register, login, me
- `sites` — CRUD climbing sites
- `climbing-routes` — CRUD routes per site
- `logbook` — user ascent log + `/stats` endpoint (monthly counts, grade distribution)

### Database Pattern
Single `pg.Pool` in `backend/src/db.ts`. All queries use parameterized SQL (`$1, $2`). No ORM.

### Environment
Copy `backend/.env.example` to `backend/.env`. Required vars:
```
PORT=3001
DATABASE_URL=postgresql://verticallog:verticallog_pass@localhost:5432/verticallog
JWT_SECRET=...
```

Vite proxies `/api/*` to `localhost:3001` (configured in `frontend/vite.config.ts`).

## Demo Account
- Email: `admin@verticallog.fr` / Password: `admin123` / Role: `admin`
