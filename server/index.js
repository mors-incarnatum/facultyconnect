const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');

const exphbs = require('express-handlebars');

const routes = require('./routes/routes.js');

const db = require('./models/db.js');

const seed = require('./models/seed.js');

const auth = require('./utils/auth.js');

const http = require('./utils/http.js');

const hbsHelpers = require('./utils/hbsHelpers.js');

const app = express();
const port = Number(process.env.PORT) || 3000;

/* Handlebars (.hbs) views live in server/views: layouts/, partials/ and one file per page */
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: hbsHelpers
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

/* Static files (CSS, client-side JS, images, avatars) are served from server/public */
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(auth.attachUser);

app.use('/', routes);

app.use(function (req, res) {
    http.sendError(res, 404, 'Page not found.');
});

app.use(function (err, req, res, next) {
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }
    return http.sendError(res, 500, 'Something went wrong on our side.');
});

async function main() {
    try {

        await db.connect();

        await seed.seedIfEmpty();

        app.listen(port, function () {
            console.log('app listening at port ' + port);
        });
    } catch (err) {
        console.log('Connection to MongoDB failed: ');
        console.error(err);
    }
}

main();