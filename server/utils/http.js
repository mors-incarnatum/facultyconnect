const USER_COOKIE = 'fc_user';

const FLASH_COOKIE = 'fc_flash';

function parseCookies(header) {
    var cookies = {};
    if (!header) {
        return cookies;
    }

    var pairs = String(header).split(';');
    for (var i = 0; i < pairs.length; i++) {
        var index = pairs[i].indexOf('=');
        if (index === -1) {
            continue;
        }
        var key = pairs[i].slice(0, index).trim();
        var value = pairs[i].slice(index + 1).trim();
        try {
            cookies[key] = decodeURIComponent(value);
        } catch (err) {
            cookies[key] = value;
        }
    }
    return cookies;
}

// Query-string and form values can arrive as arrays or objects (e.g. ?status[$ne]=x).
// Always coerce to a plain string before using them in a MongoDB query.
function str(value) {
    if (value == null || typeof value === 'object') {
        return '';
    }
    return String(value).trim();
}

// Only allow redirects/back-links to paths inside this app.
function safeBack(value, fallback) {
    var path = str(value);
    if (path.charAt(0) === '/' && path.charAt(1) !== '/' && path.indexOf('\\') === -1) {
        return path;
    }
    return fallback;
}

function setFlash(res, flash) {
    res.cookie(FLASH_COOKIE, JSON.stringify(flash), { httpOnly: true, sameSite: 'lax' });
}

function readFlash(req, res) {
    var raw = req.cookies[FLASH_COOKIE];
    if (!raw) {
        return null;
    }

    res.clearCookie(FLASH_COOKIE);
    try {
        var parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
        return null;
    }
}

// Renders views/error.hbs. Falls back to plain text while that view does not exist yet.
function sendError(res, status, message) {
    res.status(status).render('error', { status: status, message: message }, function (err, html) {
        if (err) {
            return res.type('text/plain').send(status + ' - ' + message);
        }
        return res.send(html);
    });
}

module.exports = {
    USER_COOKIE: USER_COOKIE,
    FLASH_COOKIE: FLASH_COOKIE,
    parseCookies: parseCookies,
    str: str,
    safeBack: safeBack,
    setFlash: setFlash,
    readFlash: readFlash,
    sendError: sendError
};