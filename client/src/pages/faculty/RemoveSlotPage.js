(function (FC, $) {
  'use strict';

  const {
    MissingRecord,
    PageHead,
    StatusBadge,
    createLink,
    navigate,
    getApp,
    fmtRange,
    fmtShort,
    modeLabel,
  } = FC;

  function createRemoveSlotPage({ params }) {
    let currentParams = params;
    let error = '';
    const $root = $('<div>');

    const render = () => {
      const { user, getSlot, holderOf, removeFacultySlot, setFeedback } = getApp();
      const id = currentParams.id;
      const slot = getSlot(id);
      $root.empty();

      if (!slot || slot.facultyId !== user.id) {
        $root.append(MissingRecord({ availability: true }));
        return;
      }

      const holder = holderOf(id);
      const $card = $('<div>').addClass('card');
      const $errorBox = $('<div>').addClass('form-error').attr('role', 'alert');

      $card.append(
        $('<h2>').text(`${fmtShort(slot.date)} · ${fmtRange(slot.start, slot.end)}`),
        $('<p>').addClass('muted faculty-spaced').text(`${modeLabel(slot)} · ${slot.location}`),
        StatusBadge({ status: holder?.status || 'available' }),
        $('<p>')
          .addClass('faculty-spaced')
          .text(
            holder
              ? 'This time is reserved. Manage its appointment before changing availability.'
              : 'Students will no longer be able to request this time slot.',
          ),
      );

      if (error) {
        $errorBox.text(error);
        $card.append($errorBox);
      }

      $card.append(
        $('<div>')
          .addClass('btn-row')
          .append(
            $('<button>')
              .addClass('btn danger')
              .prop('disabled', !!holder)
              .text('Remove time slot')
              .on('click', () => {
                const result = removeFacultySlot(id);
                if (!result.ok) {
                  error = result.error;
                  $errorBox.text(error);
                  if (!$errorBox.parent().length) $card.find('.btn-row').before($errorBox);
                  return;
                }
                const feedback = 'Time slot removed for this demo.';
                setFeedback(feedback);
                navigate('/faculty/availability/slots', { state: { feedback } });
              }),
            createLink('/faculty/availability/slots', 'Keep time slot', { className: 'btn' }),
          ),
      );

      $root.append(
        PageHead({
          title: 'Remove this time slot?',
          subtitle: 'Review the schedule before removing it from your published availability.',
        }),
        $card,
      );
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        error = '';
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data')) render();
      },
    };
  }

  FC.createRemoveSlotPage = createRemoveSlotPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
