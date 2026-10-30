# FacultyConnect

## MVC structure

  Not Finalized

## Run

```sh
npm install
```

## Scripts

- `npm run dev`: run client and server together.
- `npm run build`: build the client.
- `npm start`: run the server.
- `npm run preview --workspace client`: preview the built client.

## Packages Used

Versions below are the dependency ranges declared in the workspace `package.json` files.

### Frontend (`client`)

| Package | Version range | Purpose |
| --- | --- | --- |
| `react` | `^19.3.1` | UI components, hooks, and application state. |
| `react-dom` | `^19.3.1` | Renders the React application in the browser. |
| `react-router-dom` | `^7.1.1` | Client-side routing for public, student, and faculty screens. |

The frontend currently uses mock data and browser state.

### Development tools

| Package | Version range | Workspace | Purpose |
| --- | --- | --- | --- |
| `vite` | `^8.3.5` | `client` | Development server, hot module replacement, production builds, and build preview. |
| `@vitejs/plugin-react` | `^6.1.2` | `client` | React support and Fast Refresh in Vite. |
| `concurrently` | `^10.0.6` | Root | Runs the client and server together through `npm run dev`. |

