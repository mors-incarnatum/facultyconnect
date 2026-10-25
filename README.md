# FacultyConnect — MERN setup

Setup only: blank React client, Express/Node server, and Mongoose connection configuration. No pages, API routes, models, authentication, or application features.

## MVC structure

```text
client/src/
  views/                React screens (View layer; empty)
  App.jsx               Blank application root
  main.jsx              React entry point
server/src/
  config/
    env.js              Environment configuration
    database.js         MongoDB connection
  models/               Mongoose schemas and models (empty)
  controllers/          Request handlers (empty)
  routes/
    index.js            Empty router mounted at /api
  app.js                Express middleware and route mounting
  index.js              Database initialization and server startup
```

Future requests follow routes → controllers → models. React provides the View
layer in this MERN project; server-side templates are not needed.
The empty folders contain `.gitkeep` files so Git can preserve the scaffold.
No feature models, controllers, endpoints, or screens are implemented.

## Run

```sh
npm install
npm run dev
```

Client: http://localhost:3000. Server: http://localhost:5000.
The client is intentionally blank; the server has no routes, so requests return 404.

## MongoDB

Provide a running local MongoDB instance or a MongoDB Atlas connection string.
Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
Restart the server after changing environment variables.
Without `server/.env`, the server starts without a database connection.

## Scripts

- `npm run dev`: run client and server together.
- `npm run build`: build the client.
- `npm start`: run the server.
- `npm run preview --workspace client`: preview the built client.
