(function (FC, $) {
  'use strict';

  const {
    AppointmentNotFound,
    BookingStepper,
    PageHead,
    StatusBadge,
    createLink,
    getOwnedAppointment,
    fmtLong,
    fmtRange,
    modeLabel,
    topicLine,
  } = FC;

  function createRequestSubmittedPage({ params }) {
    let currentParams = params;
    const $root = $('<div>');

    const render = () => {
      const a = getOwnedAppointment(currentParams.id);
      $root.empty();

      if (!a) {
        $root.append(AppointmentNotFound());
        return;
      }

      const $card = $('<div>').addClass('card').css('padding', '32px').append(
        StatusBadge({ status: a.status }),
        $('<h2>').css({ fontSize: '38px', margin: '18px 0 10px' }).text(`${fmtLong(a.slot.date)} · ${fmtRange(a.slot.start, a.slot.end)}`),
        $('<h3>').css({ fontSize: '26px', margin: '0 0 14px' }).text(`${a.faculty.name} · ${a.faculty.department}`),
        $('<p>').addClass('muted').text(`${modeLabel(a.slot)} · ${a.slot.location}`),
        $('<hr>').addClass('divider'),
        $('<strong>').text(topicLine(a)),
      );

      if (a.description) {
        $card.append($('<p>').addClass('muted').css('margin-top', '10px').text(a.description));
      }

      $card.append(
        $('<div>')
          .addClass('notice')
          .css({ margin: '20px 0', padding: '24px' })
          .append(
            $('<h3>').css({ fontSize: '24px', marginBottom: '10px' }).text('What happens next'),
            document.createTextNode(
              a.status === 'pending'
                ? 'The selected slot is reserved. Your faculty member will review the request; the consultation remains pending until approved. Faculty must accept it at least 24 hours before the consultation, or it is automatically declined.'
                : `This appointment is now ${a.status}. Open the appointment record to review its current details.`,
            ),
          ),
        $('<div>')
          .addClass('btn-row')
          .css('margin-top', 0)
          .append(
            createLink(`/student/appointments?id=${a.id}`, 'View my appointment', { className: 'btn primary' }),
            createLink('/student', 'Back to overview', { className: 'btn' }),
          ),
      );

      $root.append(
        PageHead({
          title: a.status === 'pending' ? 'Your request has been sent' : 'Your consultation request',
          subtitle:
            a.status === 'pending'
              ? 'Your time is reserved while you wait for faculty approval.'
              : 'View the latest status and details in My appointments.',
        }),
        BookingStepper({ current: 4 }),
        $card,
      );
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock')) render();
      },
    };
  }

  FC.createRequestSubmittedPage = createRequestSubmittedPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
