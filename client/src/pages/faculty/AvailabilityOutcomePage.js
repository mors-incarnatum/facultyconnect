(function (FC, $) {
  'use strict';

  const { PageHead, createLink, getLocation, fmtRange, fmtShort } = FC;

  function createAvailabilityOutcomePage({ removed = false } = {}) {
    let isRemoved = removed;
    const $root = $('<div>');

    const render = () => {
      const { state } = getLocation();
      const weeks = Number(state?.weeks) || 4;
      const $card = $('<div>').addClass('card faculty-spaced');

      if (state?.slot) {
        $card.append(
          $('<h2>').text(isRemoved ? 'Removed consultation slot' : 'Published consultation slot'),
          $('<p>')
            .addClass('faculty-spaced')
            .text(`${fmtShort(state.slot.date)} · ${fmtRange(state.slot.start, state.slot.end)}`),
          $('<p>').addClass('muted').text(`One appointment · ${state.slot.location}`),
        );
      } else {
        $card.append(
          $('<p>').text(
            state?.published
              ? `Weekly hours and date exceptions have been published for the next ${weeks === 1 ? '1 week' : `${weeks} weeks`}.`
              : 'Review your current published availability below.',
          ),
        );
      }

      $card.append(
        $('<div>')
          .addClass('btn-row')
          .append(createLink('/faculty/availability/slots', 'Back to availability', { className: 'btn primary' })),
      );

      $root.empty().append(
        PageHead({
          title: isRemoved ? 'Time slot removed' : 'Availability saved',
          subtitle: isRemoved
            ? 'This selected slot has been removed from published availability.'
            : 'Your consultation schedules are ready for students to view.',
        }),
        $('<div>').addClass('notice').text(isRemoved ? 'Removal complete' : 'Your availability is up to date'),
        $card,
      );
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        isRemoved = Boolean(nextCtx?.removed);
        render();
      },
    };
  }

  FC.createAvailabilityOutcomePage = createAvailabilityOutcomePage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
