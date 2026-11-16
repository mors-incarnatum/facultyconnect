(function (FC, $) {
  'use strict';

  const {
    createLink,
    getOwnedAppointment,
    fmtLong,
    fmtRange,
    topicLine,
    AppointmentNotFound,
    PageHead,
    StatusBadge,
  } = FC;

  const OUTCOMES = {
    updated: {
      title: 'Consultation topic updated',
      subtitle: 'Your faculty member can view the revised topic before your meeting.',
    },
    deleted: {
      title: 'Consultation topic deleted',
      subtitle: 'Your appointment is still scheduled.',
      message: 'No topic added. You can add one again at any time before the consultation.',
    },
    cancelled: {
      title: 'Appointment cancelled',
      subtitle: 'The record stays in your previous appointments.',
      message: 'Need another time? Browse open consultation slots.',
    },
  };

  function AppointmentOutcome({ outcome, params = {} }) {
    const a = getOwnedAppointment(params.id);
    if (!a) {
      return AppointmentNotFound();
    }

    const { title, subtitle, message } = OUTCOMES[outcome];
    const $wrap = $('<div>');
    $wrap.append(PageHead({ title, subtitle }));

    const $card = $('<div>').addClass('card');
    $card.append(StatusBadge({ status: a.status }));
    $card.append(
      $('<h2>')
        .css({ fontSize: '26px', margin: '14px 0' })
        .text(`${a.faculty.name} · ${fmtLong(a.slot.date)} · ${fmtRange(a.slot.start, a.slot.end)}`),
    );

    if (outcome === 'updated') {
      $card.append($('<strong>').text(topicLine(a)));
      if (a.description) {
        $card.append($('<p>').addClass('muted').css('margin-top', '10px').text(a.description));
      }
    } else {
      $card.append($('<p>').addClass('muted').text(message));
    }

    const $btnRow = $('<div>').addClass('btn-row');
    $btnRow.append(
      createLink(
        `/student/appointments?id=${a.id}`,
        outcome === 'cancelled' ? 'View the cancelled record' : 'Back to my appointments',
        { className: 'btn primary' },
      ),
    );
    if (outcome === 'deleted') {
      $btnRow.append(
        createLink(`/student/appointments/${a.id}/edit-topic`, 'Add a topic', { className: 'btn' }),
      );
    }
    if (outcome === 'cancelled') {
      $btnRow.append(
        createLink('/student', 'Back to overview', { className: 'btn' }),
        createLink('/student/faculty', 'Find faculty', { className: 'btn' }),
      );
    }

    $card.append($btnRow);
    $wrap.append($card);
    return $wrap.children();
  }

  FC.AppointmentOutcome = AppointmentOutcome;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
