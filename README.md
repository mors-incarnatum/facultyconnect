# FacultyConnect

FacultyConnect is a consultation booking web application for De La Salle University. Students search for faculty members, browse their open consultation slots and request a booking. Faculty publish their availability and accept, decline or complete the requests they receive.

**Course:** Web Application Development (CCAPDEV), Phase 2

## Team Members

- **Sean Marthy Arambulo** (`sean_arambulo@dlsu.edu.ph`)
- **Zachary Andre Cruz** (`zachary_andre_cruz@dlsu.edu.ph`)

---

## Tech Stack

Phase 2 is a server-rendered application. Every page is built on the server and sent to the browser as HTML.

| Layer | Technology |
|---|---|
| Server | Node.js with Express 4 |
| Views | Handlebars (`express-handlebars`), `.hbs` files |
| Database | MongoDB through Mongoose 7 |
| Client-side code | Plain CSS and a small `app.js` (no framework, no build step) |

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (default `mongodb://127.0.0.1:27017`), or a MongoDB Atlas connection string

## Quick Start

1. Install the dependencies from the project root:

   ```sh
   npm install
   ```

2. Create the environment file:

   ```sh
   cp server/.env.example server/.env
   ```

   The defaults work with a local MongoDB. Edit `server/.env` only if your port or database address is different.

3. Make sure MongoDB is running, then start the server:

   ```sh
   npm start
   ```

4. Open `http://localhost:3000`.

On the first start the app creates the `facultyconnect` database and fills it with sample data. Later starts keep whatever is already in the database, so nothing is overwritten. To get the sample data back, drop the database (for example `mongosh facultyconnect --eval "db.dropDatabase()"`) and start the server again.

### Environment Variables (`server/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/facultyconnect` | MongoDB connection string |

### Scripts

- `npm start`: run the server (`server/index.js`).
- `npm run dev`: same as `npm start`.

## Demo Accounts

Every sample account uses the password `password123`.

| Role | Name | Email |
|---|---|---|
| Student | Alex Dela Cruz | `sample.alex.delacruz@dlsu.edu.ph` |
| Student | Maya Reyes | `sample.maya.reyes@dlsu.edu.ph` |
| Student | Daniel Tan | `sample.daniel.tan@dlsu.edu.ph` |
| Student | Isabella Navarro | `sample.isabella.navarro@dlsu.edu.ph` |
| Student | Jacob Lim | `sample.jacob.lim@dlsu.edu.ph` |
| Faculty | Dr. Sofia Santos | `sample.sofia.santos@dlsu.edu.ph` |
| Faculty | Miguel Reyes | `sample.miguel.reyes@dlsu.edu.ph` |
| Faculty | Andrea Cruz | `sample.andrea.cruz@dlsu.edu.ph` |
| Faculty | Paolo Mendoza | `sample.paolo.mendoza@dlsu.edu.ph` |
| Faculty | Camille Garcia | `sample.camille.garcia@dlsu.edu.ph` |
| Faculty | Rafael Domingo | `sample.rafael.domingo@dlsu.edu.ph` |

New accounts can also be created from the **Register** page. Sample slots are created relative to the day the database was first seeded.

## Features

### Public

- Home page, sign in, register (student or faculty) and sign out.
- Live email check on the register form, so a duplicate email is reported before submitting.
- Signed-in users who open a page for the wrong role are redirected to their own home page.

### Student

- Overview of upcoming and recent consultations.
- Search faculty by name and department, and open a faculty profile.
- Week calendar of a faculty member's open slots.
- Request a consultation with a subject, topic and description. The form re-checks that the slot is still free, and a conflict page explains when it is not.
- My appointments: edit or delete the topic, or cancel a request.
- Help page.

### Faculty

- Overview of incoming requests and today's consultations.
- Consultation requests: view the details, then confirm, decline or complete them.
- Availability: set weekly hours, add, edit or remove individual slots, and see all published slots.
- Help page.

### Booking rules

- A request must be made at least 24 hours before the consultation. After that the slot closes.
- A request that is still pending 24 hours before the consultation is declined automatically.
- A slot can hold only one pending or confirmed request at a time. If someone else gets it first, the student is shown the booking conflict page and can pick another time.
- Appointment statuses are `pending`, `confirmed`, `completed`, `declined` and `cancelled`.

## Project Structure

```
facultyconnect/
├── package.json            Root workspace; npm start runs the server
├── README.md
├── AI_USAGE_DECLARATION.md
└── server/
    ├── index.js            App setup: Handlebars, static files, routes, MongoDB connection, seeding
    ├── routes/routes.js    Every URL, the layout choice and the student/faculty role guards
    ├── controllers/        Request handlers
    │   ├── controller.js         Home, sign in, sign out, help pages
    │   ├── signupController.js   Register and email check
    │   ├── profileController.js  Faculty search, profiles and calendar
    │   ├── studentController.js  Booking and appointment pages
    │   └── facultyController.js  Requests and availability pages
    ├── models/             Mongoose schemas, database helper and seed data
    │   ├── db.js                 Thin wrapper over Mongoose (connect, find, insert, update, delete)
    │   ├── seed.js               Fills an empty database from initialData.json
    │   ├── *Model.js             User, Student, Faculty, Slot, Appointment, Schedule
    │   └── initialData.json      Sample faculty, students, slots and appointments
    ├── utils/              Sign-in cookie, flash messages, date formatting and Handlebars helpers
    ├── views/              Handlebars templates
    │   ├── layouts/              main, auth and workspace page frames
    │   ├── partials/             head, flash, avatar, badge, sidebar
    │   ├── student/              Student pages
    │   └── faculty/              Faculty pages
    └── public/             Files served as-is: css/, js/app.js, avatars/
```

## Routes

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Home page |
| GET, POST | `/login` | Public | Sign in |
| GET, POST | `/logout` | Public | Sign out |
| GET, POST | `/register` | Public | Create an account |
| GET | `/register/success` | Public | Account created page |
| GET | `/getCheckEmail` | Public | JSON email availability check |
| GET | `/student` | Student | Overview |
| GET | `/student/faculty`, `/student/faculty/calendar`, `/student/faculty/:id` | Student | Faculty search, calendar and profile |
| GET, POST | `/student/request` | Student | Book a consultation |
| GET | `/student/request/submitted/:id`, `/student/booking-conflict` | Student | Booking outcome pages |
| GET | `/student/appointments` | Student | My appointments |
| GET, POST | `/student/appointments/:id/edit-topic`, `/delete-topic`, `/cancel` | Student | Change or cancel an appointment |
| GET | `/getCheckSlot` | Student | JSON check that a slot is still free |
| GET | `/faculty` | Faculty | Overview |
| GET | `/faculty/consultations`, `/faculty/consultations/:id` | Faculty | Requests and details |
| POST | `/faculty/consultations/:id/status` | Faculty | Confirm, decline or complete a request |
| GET, POST | `/faculty/availability` | Faculty | Weekly hours |
| GET, POST | `/faculty/availability/new`, `/slots`, `/:id/edit`, `/:id/remove` | Faculty | Manage individual slots |

Pages that change data use POST and then redirect to a confirmation page. Search and filters use GET, so the address bar keeps the filter state.

## Packages Used

### Runtime (`server/package.json`)

| Package | Version range | Purpose |
|---|---|---|
| `express` | `^4.18.2` | Web server and routing |
| `express-handlebars` | `^7.1.2` | Handlebars view engine with layouts and partials |
| `mongoose` | `^7.3.4` | MongoDB models and queries |
| `dotenv` | `^18.0.10` | Loads `server/.env` |

There are no development-only packages.

## Data Model

| Collection | Main fields |
|---|---|
| `users` (`Student`, `Faculty`) | `id`, `role`, `name`, `email`, `pw`, `avatar`, `motto`, plus `department` and `rank` for faculty or `program` and `yearLevel` for students |
| `slots` | `id`, `facultyId`, `date`, `start`, `end`, `mode`, `location` |
| `appointments` | `id`, `studentId`, `slotId`, `status`, `subject`, `topic`, `description`, `autoDeclined` |
| `schedules` | `facultyId`, `weekly` hours, `exceptions`, `location`, `weeks` |

## Known Limitations

- **Passwords are stored as plain text.** Password hashing was not part of this phase.
- **The sign-in cookie is not signed.** Signing in stores the user's ID in a plain `fc_user` cookie. This is the simple login state used for this phase, and it means anyone who edits the cookie can act as another user. A real deployment would use signed sessions.
- **Sample slots go out of date.** Sample slots are dated from the day the database was first seeded, so after a few weeks they are all in the past. Drop the database and restart to create fresh ones.
- **No `npm install` is bundled.** `node_modules` is not part of the submission; run `npm install` first.