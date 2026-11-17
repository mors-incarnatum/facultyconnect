const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export function parseDate(iso) {
    const parts = iso.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function toIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function addDays(iso, n) {
    const d = parseDate(iso);
    d.setDate(d.getDate() + n);
    return toIso(d);
}

export function weekStartOf(iso) {
    const d = parseDate(iso);
    const offset = (d.getDay() + 6) % 7;
    return addDays(iso, -offset);
}

export function fmtLong(iso) {
    const d = parseDate(iso);
    return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtShort(iso) {
    const d = parseDate(iso);
    return `${DAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function fmtMonthDay(iso) {
    const d = parseDate(iso);
    return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function fmtWeekRange(startIso) {
    const a = parseDate(startIso);
    const b = parseDate(addDays(startIso, 4));
    const sameMonth = a.getMonth() === b.getMonth();
    if (sameMonth) {
        return `${MONTHS[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`;
    }
    return `${MONTHS[a.getMonth()].slice(0, 3)} ${a.getDate()} – ${MONTHS[b.getMonth()].slice(0, 3)} ${b.getDate()}, ${b.getFullYear()}`;
}

export function fmtDayHeader(iso) {
    const d = parseDate(iso);
    return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()}`;
}

export function fmtTime(hhmm, withSuffix = true) {
    const parts = hhmm.split(':').map(Number);
    let h = parts[0];
    const m = parts[1];
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const base = `${h}:${String(m).padStart(2, '0')}`;
    if (withSuffix) {
        return `${base} ${suffix}`;
    }
    return base;
}

export function fmtRange(start, end) {
    const sSuffix = Number(start.split(':')[0]) >= 12 ? 'PM' : 'AM';
    const eSuffix = Number(end.split(':')[0]) >= 12 ? 'PM' : 'AM';
    if (sSuffix === eSuffix) {
        return `${fmtTime(start, false)}–${fmtTime(end)}`;
    }
    return `${fmtTime(start)}–${fmtTime(end)}`;
}

export function addMinutes(hhmm, mins) {
    const parts = hhmm.split(':').map(Number);
    const total = parts[0] * 60 + parts[1] + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function minutesBetween(a, b) {
    const aParts = a.split(':').map(Number);
    const bParts = b.split(':').map(Number);
    return bParts[0] * 60 + bParts[1] - (aParts[0] * 60 + aParts[1]);
}

export function initials(name) {
    const cleaned = name.replace(/^(Dr\.|Prof\.)\s*/, '');
    const words = cleaned.split(' ');
    const chars = [];
    for (let i = 0; i < words.length && chars.length < 2; i++) {
        if (words[i]) {
            chars.push(words[i][0]);
        }
    }
    return chars.join('');
}

export function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
