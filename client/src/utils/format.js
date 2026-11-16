(function (FC) {
  'use strict';

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const parseDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const toIso = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const addDays = (iso, n) => {
    const d = parseDate(iso);
    d.setDate(d.getDate() + n);
    return toIso(d);
  };
  /** Monday of the week containing the given ISO date. */
  const weekStartOf = (iso) => {
    const d = parseDate(iso);
    const offset = (d.getDay() + 6) % 7;
    return addDays(iso, -offset);
  };

  const fmtLong = (iso) => {
    const d = parseDate(iso);
    return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  };
  const fmtShort = (iso) => {
    const d = parseDate(iso);
    return `${DAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  };
  const fmtMonthDay = (iso) => {
    const d = parseDate(iso);
    return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  };
  const fmtWeekRange = (startIso) => {
    const a = parseDate(startIso);
    const b = parseDate(addDays(startIso, 4));
    const sameMonth = a.getMonth() === b.getMonth();
    return sameMonth
      ? `${MONTHS[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`
      : `${MONTHS[a.getMonth()].slice(0, 3)} ${a.getDate()} – ${MONTHS[b.getMonth()].slice(0, 3)} ${b.getDate()}, ${b.getFullYear()}`;
  };
  const fmtDayHeader = (iso) => {
    const d = parseDate(iso);
    return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()}`;
  };

  const fmtTime = (hhmm, withSuffix = true) => {
    let [h, m] = hhmm.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const base = `${h}:${String(m).padStart(2, '0')}`;
    return withSuffix ? `${base} ${suffix}` : base;
  };
  const fmtRange = (start, end) => {
    const sSuffix = Number(start.split(':')[0]) >= 12 ? 'PM' : 'AM';
    const eSuffix = Number(end.split(':')[0]) >= 12 ? 'PM' : 'AM';
    return sSuffix === eSuffix
      ? `${fmtTime(start, false)}–${fmtTime(end)}`
      : `${fmtTime(start)}–${fmtTime(end)}`;
  };
  const addMinutes = (hhmm, mins) => {
    const [h, m] = hhmm.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  const minutesBetween = (a, b) => {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    return bh * 60 + bm - (ah * 60 + am);
  };
  const initials = (name) =>
    name.replace(/^(Dr\.|Prof\.)\s*/, '').split(' ').map((p) => p[0]).slice(0, 2).join('');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  Object.assign(FC, {
    parseDate,
    toIso,
    addDays,
    weekStartOf,
    fmtLong,
    fmtShort,
    fmtMonthDay,
    fmtWeekRange,
    fmtDayHeader,
    fmtTime,
    fmtRange,
    addMinutes,
    minutesBetween,
    initials,
    cap,
  });
})(globalThis.FC = globalThis.FC || {});
