(function (FC, $) {
  'use strict';

  const {
    createLink,
    isRequestOpen,
    getApp,
    isFutureSlot,
    fmtRange,
    fmtShort,
    modeLabel,
    StatusBadge,
  } = FC;

  function PublishedSlotDay({ date, entries, referencedSlotIds }) {
    const { now } = getApp();
    const reservedCount = entries.filter(({ holder }) => holder).length;

    const $details = $('<details>').addClass('published-day').attr('name', 'published-slot-day');
    const $summary = $('<summary>');
    $summary.append(
      $('<span>').addClass('published-day-title').text(fmtShort(date)),
      $('<span>')
        .addClass('published-day-counts')
        .text(
          `${entries.length} ${entries.length === 1 ? 'slot' : 'slots'} · ${entries.length - reservedCount} available · ${reservedCount} reserved`,
        ),
    );

    const $slotsWrap = $('<div>').addClass('published-day-slots');
    for (const { slot, holder } of entries) {
      const $row = $('<div>').addClass('appt-row');
      const closedSuffix = !holder && isFutureSlot(slot, now) && !isRequestOpen(slot, now)
        ? ' · Closed to requests (less than 24 hours away)'
        : '';

      const $info = $('<div>').append(
        $('<strong>').text(fmtRange(slot.start, slot.end)),
        $('<span>').addClass('meta').text(`${modeLabel(slot)} · ${slot.location}${closedSuffix}`),
      );

      const $badge = StatusBadge({ status: holder?.status || 'available' });

      const $actions = $('<div>').addClass('slot-actions');
      if (holder) {
        $actions.append(
          createLink(`/faculty/consultations/${holder.id}`, 'View appointment', { className: 'btn' }),
        );
      } else if (referencedSlotIds.has(slot.id)) {
        $actions.append($('<span>').addClass('muted small').text('History retained'));
      } else {
        $actions.append(
          createLink(`/faculty/availability/${slot.id}/edit`, 'Edit', { className: 'btn' }),
          createLink(`/faculty/availability/${slot.id}/remove`, 'Remove', { className: 'btn' }),
        );
      }

      $row.append($info, $badge, $actions);
      $slotsWrap.append($row);
    }

    $details.append($summary, $slotsWrap);
    return $details;
  }

  FC.PublishedSlotDay = PublishedSlotDay;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
