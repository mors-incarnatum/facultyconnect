# FacultyConnect

## Team Members

- **Sean Marthy Arambulo** (`sean_arambulo@dlsu.edu.ph`)
- **Zachary Andre Cruz** (`zachary_andre_cruz@dlsu.edu.ph`)

---
## Quick Start

No server, build step, or `npm install` is required. Open either HTML entry point directly in any web browser (`file://`):

- **Root entry point:** `index.html` (automatically redirects to `./client/index.html` while preserving `#/...` hash routes)
- **Main entry point:** `client/index.html` (loads all stylesheets, jQuery, and static JavaScript modules directly)

### Demo Accounts (Phase 1)

- **Student:** `sample.alex.delacruz@dlsu.edu.ph` (any non-empty password)
- **Faculty:** `sample.sofia.santos@dlsu.edu.ph` (any non-empty password)

## Packages Used

### Frontend (`client/`)

| Package | Version | Location | Purpose |
|---|---|---|---|
| `jquery` | `3.7.1` | `client/public/vendor/jquery.min.js` | Bundled locally for DOM rendering, event handling, and UI updates over `file://` |

*(No server, bundler, or npm runtime/dev packages are required.)*
