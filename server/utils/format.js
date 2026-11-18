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

var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

var DAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function weekStartOf(iso) {
    var d = parseDate(iso);
    var offset = (d.getDay() + 6) % 7;
    return addDays(iso, -offset);
}

function fmtLong(iso) {
    var d = parseDate(iso);
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
}

function fmtShort(iso) {
    var d = parseDate(iso);
    return DAYS[d.getDay()].slice(0, 3) + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
}

function fmtMonthDay(iso) {
    var d = parseDate(iso);
    return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate();
}

function fmtWeekRange(startIso) {
    var a = parseDate(startIso);
    var b = parseDate(addDays(startIso, 4));
    if (a.getMonth() === b.getMonth()) {
        return MONTHS[a.getMonth()] + ' ' + a.getDate() + '\u2013' + b.getDate() + ', ' + b.getFullYear();
    }
    return MONTHS[a.getMonth()].slice(0, 3) + ' ' + a.getDate() + ' \u2013 '
        + MONTHS[b.getMonth()].slice(0, 3) + ' ' + b.getDate() + ', ' + b.getFullYear();
}

function fmtDayHeader(iso) {
    var d = parseDate(iso);
    return DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate();
}

function fmtTime(hhmm, withSuffix) {
    var parts = hhmm.split(':').map(Number);
    var h = parts[0];
    var m = parts[1];
    var suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var base = h + ':' + String(m).padStart(2, '0');
    return withSuffix === false ? base : base + ' ' + suffix;
}

function fmtRange(start, end) {
    var sSuffix = Number(start.split(':')[0]) >= 12 ? 'PM' : 'AM';
    var eSuffix = Number(end.split(':')[0]) >= 12 ? 'PM' : 'AM';
    if (sSuffix === eSuffix) {
        return fmtTime(start, false) + '\u2013' + fmtTime(end);
    }
    return fmtTime(start) + '\u2013' + fmtTime(end);
}

function initials(name) {
    var cleaned = String(name || '').replace(/^(Dr\.|Prof\.)\s*/, '');
    var words = cleaned.split(' ');
    var chars = [];
    for (var i = 0; i < words.length && chars.length < 2; i++) {
        if (words[i]) {
            chars.push(words[i][0]);
        }
    }
    return chars.join('');
}

function cap(s) {
    s = String(s || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const format = {
    parseDate: parseDate,
    toIso: toIso,
    addDays: addDays,
    addMinutes: addMinutes,
    minutesBetween: minutesBetween,
    weekStartOf: weekStartOf,
    fmtLong: fmtLong,
    fmtShort: fmtShort,
    fmtMonthDay: fmtMonthDay,
    fmtWeekRange: fmtWeekRange,
    fmtDayHeader: fmtDayHeader,
    fmtTime: fmtTime,
    fmtRange: fmtRange,
    initials: initials,
    cap: cap
};

module.exports = format;