const format = require('./format.js');

const presentation = require('./presentation.js');

// Handlebars helpers available in every .hbs view and partial.
// Every helper receives Handlebars' options object as its last argument, so values are read by position.

const helpers = {

    eq: function (a, b) {
        return a === b;
    },

    neq: function (a, b) {
        return a !== b;
    },

    lt: function (a, b) {
        return a < b;
    },

    gt: function (a, b) {
        return a > b;
    },

    and: function (a, b) {
        return Boolean(a && b);
    },

    or: function (a, b) {
        return Boolean(a || b);
    },

    not: function (a) {
        return !a;
    },

    includes: function (list, value) {
        return Array.isArray(list) && list.indexOf(value) !== -1;
    },

    startsWith: function (text, prefix) {
        return typeof text === 'string' && typeof prefix === 'string' && text.indexOf(prefix) === 0;
    },

    // {{encode value}} -> value safe to place inside a URL query string
    encode: function (value) {
        return encodeURIComponent(String(value == null ? '' : value));
    },

    // {{#each (take list 3)}} -> the first 3 items of a list
    take: function (list, count) {
        return Array.isArray(list) ? list.slice(0, Number(count)) : [];
    },

    // {{#each (otherSlots slots selectedId 4)}} -> up to 4 slots other than the selected one
    otherSlots: function (slots, selectedId, count) {
        if (!Array.isArray(slots)) {
            return [];
        }
        return slots
            .filter(function (slot) {
                return slot.id !== selectedId;
            })
            .slice(0, Number(count));
    },

    // {{url "/student/faculty" searchQuery "faculty" id "slot" slotId}}
    // Builds a link: the path, then the existing query string, then the extra name/value pairs.
    // Empty, false and missing values are left out; true becomes 1 (used for ?weekend=1).
    url: function (path, searchQuery) {
        var pairs = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
        var parts = typeof searchQuery === 'string' && searchQuery !== '' ? [searchQuery] : [];

        for (var i = 0; i + 1 < pairs.length; i += 2) {
            var value = pairs[i + 1];
            if (value === true) {
                value = '1';
            }
            if (value === undefined || value === null || value === false || value === '') {
                continue;
            }
            parts.push(encodeURIComponent(pairs[i]) + '=' + encodeURIComponent(String(value)));
        }

        return path + (parts.length ? '?' + parts.join('&') : '');
    },

    // {{period "10:00"}} -> "morning" (before noon) or "afternoon"; used by the week calendar filter
    period: function (hhmm) {
        return typeof hhmm === 'string' && hhmm < '12:00' ? 'morning' : 'afternoon';
    },

    // {{shortName "Dr. Sofia Santos"}} -> "Sofia Santos"
    shortName: function (name) {
        return String(name || '').replace(/^(Dr\.|Prof\.)\s*/, '');
    },

    // {{#each (calFaculty week)}} -> the distinct faculty who have open times in the displayed week
    calFaculty: function (week) {
        var seen = {};
        var list = [];

        if (!week || !Array.isArray(week.days)) {
            return list;
        }

        week.days.forEach(function (day) {
            day.available.forEach(function (slot) {
                if (slot.faculty && !seen[slot.facultyId]) {
                    seen[slot.facultyId] = true;
                    list.push({ id: slot.facultyId, name: slot.faculty.name });
                }
            });
        });

        return list;
    },

    join: function (list, separator) {
        if (!Array.isArray(list)) {
            return '';
        }
        return list.join(typeof separator === 'string' ? separator : ', ');
    },

    plural: function (count, singular, pluralForm) {
        return Number(count) === 1 ? singular : (typeof pluralForm === 'string' ? pluralForm : singular + 's');
    },

    add: function (a, b) {
        return Number(a) + Number(b);
    },

    cap: function (value) {
        return format.cap(value);
    },

    initials: function (name) {
        return format.initials(name);
    },

    firstName: function (name) {
        return String(name || '').split(' ')[0];
    },

    fmtLong: function (iso) {
        return iso ? format.fmtLong(iso) : '';
    },

    fmtShort: function (iso) {
        return iso ? format.fmtShort(iso) : '';
    },

    fmtMonthDay: function (iso) {
        return iso ? format.fmtMonthDay(iso) : '';
    },

    fmtDayHeader: function (iso) {
        return iso ? format.fmtDayHeader(iso) : '';
    },

    fmtWeekRange: function (iso) {
        return iso ? format.fmtWeekRange(iso) : '';
    },

    fmtTime: function (hhmm) {
        return hhmm ? format.fmtTime(hhmm) : '';
    },

    fmtRange: function (start, end) {
        return start && end ? format.fmtRange(start, end) : '';
    },

    modeLabel: function (slot) {
        return presentation.modeLabel(slot);
    },

    topicLine: function (appointment) {
        return presentation.topicLine(appointment);
    },

    // {{selected value option}} -> ' selected' for <option> elements
    selected: function (value, option) {
        return value === option ? ' selected' : '';
    },

    // {{checked flag}} -> ' checked' for checkboxes
    checked: function (flag) {
        return flag ? ' checked' : '';
    },

    json: function (value) {
        return JSON.stringify(value);
    }

};

module.exports = helpers;