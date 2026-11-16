(function (FC, $) {
  'use strict';

  const { PageHead, createLink, getLocation, navigate, getApp, fmtLong, fmtRange } = FC;

  function createBookingConflictPage() {
    const $root = $('<div>');

    const render = () => {
      const loc = getLocation();
      const { getSlot, getFaculty, availableSlotsFor, setSelection } = getApp();
      const slot = getSlot(loc.searchParams.get('slot'));
      const f = slot && getFaculty(slot.facultyId);
      const others = f ? availableSlotsFor(f.id).filter((s) => s.id !== slot.id).slice(0, 3) : [];

      const $card = $('<div>').addClass('card').append(
        $('<span>').addClass('badge pending').text('Slot reserved'),
      );
      if (slot) {
        $card.append(
          $('<h2>')
            .css({ fontSize: '26px', margin: '14px 0 6px' })
            .text(`${f.name} · ${fmtLong(slot.date)} · ${fmtRange(slot.start, slot.end)}`),
        );
      }
      $card.append(
        $('<p>')
          .addClass('muted')
          .css('margin-bottom', '18px')
          .text('Slots are checked again when you submit, so two students can never hold the same time.'),
      );

      if (others.length > 0) {
        const $otherRow = $('<div>').addClass('btn-row').css('margin-top', '10px');
        for (const s of others) {
          $otherRow.append(
            createLink(`/student/request?slot=${s.id}`, `${fmtLong(s.date)} · ${fmtRange(s.start, s.end)}`, {
              className: 'btn sm',
              state: loc.state,
            }),
          );
        }
        $card.append($('<strong>').text(`Other times with ${f.name}`), $otherRow);
      }

      $card.append(
        $('<div>')
          .addClass('btn-row')
          .append(
            $('<button>')
              .addClass('btn primary')
              .text('Choose another time')
              .on('click', () => {
                if (f) setSelection({ facultyId: f.id, slotId: others[0]?.id || null });
                navigate(`/student/faculty/calendar${f ? `?faculty=${f.id}` : ''}`, { state: loc.state });
              }),
            createLink('/student', 'Back to overview', { className: 'btn' }),
          ),
      );

      $root.empty().append(
        PageHead({
          title: 'That time was just taken',
          subtitle: 'Another student reserved this slot before your request was submitted.',
        }),
        $card,
      );
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock')) render();
      },
    };
  }

  FC.createBookingConflictPage = createBookingConflictPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
