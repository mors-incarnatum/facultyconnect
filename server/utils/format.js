function parseDate(iso) {
    var parts = iso.split('-');
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    var d = Number(parts[2]);
    return new Date(y, m - 1, d);
}

function toIso(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function addDays(iso, n) {
    var d = parseDate(iso);
    d.setDate(d.getDate() + n);
    return toIso(d);
}

function addMinutes(hhmm, mins) {
    var parts = hhmm.split(':');
    var h = Number(parts[0]);
    var m = Number(parts[1]);
    var total = h * 60 + m + mins;
    var nextHours = String(Math.floor(total / 60)).padStart(2, '0');
    var nextMinutes = String(total % 60).padStart(2, '0');
    return nextHours + ':' + nextMinutes;
}

function minutesBetween(a, b) {
    var aParts = a.split(':');
    var bParts = b.split(':');
    var ah = Number(aParts[0]);
    var am = Number(aParts[1]);
    var bh = Number(bParts[0]);
    var bm = Number(bParts[1]);
    return bh * 60 + bm - (ah * 60 + am);
}

const format = {
    parseDate: parseDate,
    toIso: toIso,
    addDays: addDays,
    addMinutes: addMinutes,
    minutesBetween: minutesBetween
};

module.exports = format;
