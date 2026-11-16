(function (FC, $) {
  'use strict';

  const {
    AppointmentNotFound,
    PageHead,
    StatusBadge,
    createLink,
    navigate,
    canManageAppointment,
    getApp,
    getOwnedAppointment,
    fmtLong,
    fmtRange,
    topicLine,
  } = FC;

  function createCancelAppointmentPage({ params }) {
    let currentParams = params;
    let error = '';
    const $root = $('<div>');

    const render = () => {
      const { now, setStatus } = getApp();
      const a = getOwnedAppointment(currentParams.id);
      $root.empty();

      if (!a) {
        $root.append(AppointmentNotFound());
        return;
      }

      const active = canManageAppointment(a, a.slot, now);
      const $card = $('<div>').addClass('card');
      const $errorBox = $('<p>').addClass('form-error').attr('role', 'alert');

      const showError = (msg) => {
        error = msg;
        if (msg) {
          $errorBox.text(msg);
          if (!$errorBox.parent().length) $card.prepend($errorBox);
        } else {
          $errorBox.remove();
        }
      };

      if (error) {
        $errorBox.text(error);
        $card.append($errorBox);
      }

      $card.append(
        StatusBadge({ status: a.status }),
        $('<h2>').css({ fontSize: '26px', margin: '14px 0 6px' }).text(a.faculty.name),
        $('<p>').css('font-weight', 600).text(`${fmtLong(a.slot.date)} · ${fmtRange(a.slot.start, a.slot.end)}`),
        $('<p>').addClass('muted').css('margin', '6px 0 18px').text(topicLine(a)),
      );

      if (active) {
        $card.append(
          $('<div>')
            .addClass('notice warn')
            .text(`Cancelling lets ${a.faculty.name} know you can no longer attend. You can request another time afterwards.`),
          $('<div>')
            .addClass('btn-row')
            .append(
              $('<button>')
                .addClass('btn danger')
                .text('Confirm cancellation')
                .on('click', () => {
                  const result = setStatus(a.id, 'cancelled');
                  if (!result.ok) {
                    showError(result.error);
                    return;
                  }
                  navigate(`/student/appointments?id=${a.id}`, {
                    state: { feedback: 'Appointment cancelled in this demo. Changes reset on reload.' },
                  });
                }),
              createLink(`/student/appointments?id=${a.id}`, 'Keep appointment', { className: 'btn' }),
            ),
        );
      } else {
        $card.append(
          $('<p>').text('This appointment can no longer be cancelled. Cancellation is available before an active consultation starts.'),
          $('<div>')
            .addClass('btn-row')
            .append(createLink(`/student/appointments?id=${a.id}`, 'Back', { className: 'btn' })),
        );
      }

      $root.append(
        PageHead({
          title: 'Cancel this appointment?',
          subtitle: 'The time slot will become available to other students.',
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
        if (reasons.has('data') || reasons.has('clock')) render();
      },
    };
  }

  FC.createCancelAppointmentPage = createCancelAppointmentPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
