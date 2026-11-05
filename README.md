# FacultyConnect

## Architecture Overview

## Quick Start

```sh
npm install
npm run dev
```

- **Frontend (Vite + React 19):** `http://localhost:3000`

### Demo Accounts (Phase 1)

- **Student:** `sample.alex.delacruz@dlsu.edu.ph` (any non-empty password)
- **Faculty:** `sample.sofia.santos@dlsu.edu.ph` (any non-empty password)

## Scripts

- `npm run dev`: Run `client` (`:3000`) and `server` (`:5000`) concurrently.
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

### Development Tools

| Package | Version range | Workspace | Purpose |
|---|---|---|---|
| `vite` | `^8.3.5` | `client` | Frontend dev server, HMR, production build, and preview |
| `@vitejs/plugin-react` | `^6.1.2` | `client` | React Fast Refresh and JSX compilation |
| `concurrently` | `^10.0.6` | Root | Runs `client` and `server` dev servers together |
