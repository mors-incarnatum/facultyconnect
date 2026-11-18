const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');

const cors = require('cors');

const routes = require('./routes/routes.js');

const db = require('./models/db.js');

const seed = require('./models/seed.js');

const app = express();
const port = Number(process.env.PORT) || 5000;
const apiPrefix = process.env.API_PREFIX || '/api';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors(corsOrigin === '*' ? undefined : { origin: corsOrigin }));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(apiPrefix, routes);

app.use(function (req, res) {
    res.status(404).send({ ok: false, error: 'Route not found' });
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
