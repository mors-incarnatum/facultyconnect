const format = require('./format.js');

function slotTime(slot, field) {
    if (!field) {
        field = 'start';
    }
    if (!slot || !slot.date || !slot[field]) {
        return NaN;
    }

    var date = format.parseDate(slot.date);
    var parts = slot[field].split(':');
    var hours = Number(parts[0]);
    var minutes = Number(parts[1]);
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
}

function hasEnded(slot, now) {
    return slotTime(slot, 'end') <= now.getTime();
}

function isFutureSlot(slot, now) {
    return slotTime(slot, 'start') > now.getTime();
}

const clock = {
    slotTime: slotTime,
    hasEnded: hasEnded,
    isFutureSlot: isFutureSlot
};

module.exports = clock;
