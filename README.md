# FacultyConnect

## Team Members

- **Sean Marthy Arambulo** (`sean_arambulo@dlsu.edu.ph`)
- **Zachary Andre Cruz** (`zachary_andre_cruz@dlsu.edu.ph`)

---
## Quick Start

```sh
npm install
```

- **Frontend (Vite + React 19):** `http://localhost:3000`
- **Entry (`index.html`):** `client/index.html` (source) / `client/dist-static/index.html` (static `file://` build)

### Demo Accounts (Phase 1)

- **Student:** `sample.alex.delacruz@dlsu.edu.ph` (any non-empty password)
- **Faculty:** `sample.sofia.santos@dlsu.edu.ph` (any non-empty password)

## Scripts

- `npm run dev --workspace client`: Run `client` (`:3000`).
- `npm run build`: Build the production React bundle in `client/dist/`.
- `npm run build:static --workspace client`: Build a self-contained single-file static bundle in `client/dist-static/index.html` (can be opened directly via `file://` without a server).
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
| `vite-plugin-singlefile` | `^2.3.4` | `client` | Inline JS and CSS into a single `index.html` for static `file://` builds |
