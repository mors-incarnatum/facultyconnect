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