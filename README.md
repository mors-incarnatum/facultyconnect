# FacultyConnect

FacultyConnect is a consultation scheduling and appointment management web application for **Northbridge University** students and faculty, built on a decoupled MERN MVC architecture (`client/` React 19 SPA + `server/` Express 5 & Mongoose 9 API).

## Architecture Overview

| Workspace / Folder | Purpose |
|---|---|
| `client/src/views/{public,student,faculty}/` | React 19 route views for Public, Student, and Faculty workflows |
| `client/src/components/` | Shared layout (`Shell.jsx`), calendar (`WeekCalendar.jsx`), and UI primitives (`ui.jsx`) |
| `client/src/state/` | `AppContext.jsx` state provider and pure scheduling/slot validation rules (`availability.js`) |
| `client/src/data/initialData.js` | Seeded Northbridge University dataset (`TODAY = "2026-10-26"`) |
| `server/src/{models,controllers,routes,config}/` | Express 5 REST API (`/api`) and Mongoose 9 database layer |
| `docs/` | Architecture standard, screen inventory, feature checklist, data contracts, and phase plans |

## Quick Start

```sh
npm install
npm run dev
```

- **Frontend (Vite + React 19):** `http://localhost:3000` (`/#/` hash routes; proxies `/api` to `:5000`)
- **Backend (Express 5 + Mongoose 9):** `http://localhost:5000`

### Demo Accounts (Phase 1)

- **Student:** `alex.johnson@northbridge.edu` (any non-empty password)
- **Faculty:** `sarah.chen@northbridge.edu` (any non-empty password)

## Scripts

- `npm run dev`: Run `client` (`:3000`) and `server` (`:5000`) concurrently.
- `npm test`: Run fast unit tests (`node --test client/src/state/availability.test.js`).
- `npm run build`: Build the production React bundle in `client/dist/`.
- `npm start`: Start the Express server (`server/src/index.js`).
- `npm run preview --workspace client`: Preview the built client bundle.

## Packages Used

### Frontend (`client/package.json`)

| Package | Version range | Purpose |
|---|---|---|
| `react` | `^19.3.1` | UI components, hooks, and application state |
| `react-dom` | `^19.3.1` | Browser DOM rendering |
| `react-router-dom` | `^7.1.1` | Client-side routing (`HashRouter`) across public, student, and faculty screens |

### Backend (`server/package.json`)

| Package | Version range | Purpose |
|---|---|---|
| `express` | `^5.3.0` | HTTP server and `/api` routing |
| `mongoose` | `^9.11.4` | MongoDB object modeling and schema validation |
| `cors` | `^2.8.6` | Cross-origin resource sharing for decoupled client/server |
| `dotenv` | `^18.0.9` | Environment variable loading from `server/.env` |

### Development Tools

| Package | Version range | Workspace | Purpose |
|---|---|---|---|
| `vite` | `^8.3.5` | `client` | Frontend dev server, HMR, production build, and preview |
| `@vitejs/plugin-react` | `^6.1.2` | `client` | React Fast Refresh and JSX compilation |
| `concurrently` | `^10.0.6` | Root | Runs `client` and `server` dev servers together |
