(function (FC, $) {
  'use strict';

  const { fmtLong, fmtRange, modeLabel, Avatar, StatusBadge } = FC;

  function AppointmentSummary({ appointment, children = null }) {
    const { status, student, slot, subject, topic, description } = appointment;

    const $card = $('<div>').addClass('card detail consultation-summary');
    $card.append(StatusBadge({ status }));

    const $studentRow = $('<div>').addClass('consultation-student');
    $studentRow.append(Avatar({ person: student, size: 'lg' }));

    const $info = $('<div>');
    const $h3 = $('<h3>').text(student.name);
    if (student.pronouns) {
      $h3.append(
        $('<span>')
          .addClass('profile-pronouns')
          .css({ marginLeft: '6px', fontSize: '11px' })
          .text(student.pronouns),
      );
    }
    $info.append($h3);
    $info.append($('<p>').addClass('muted small').text(student.program || 'Student'));
    $info.append(
      $('<p>')
        .addClass('muted small')
        .text(`${student.email}${student.yearLevel ? ` · ${student.yearLevel}` : ''}`),
    );
    $studentRow.append($info);

    $card.append(
      $studentRow,
      $('<h2>').text(fmtLong(slot.date)),
      $('<p>').addClass('consultation-time').text(fmtRange(slot.start, slot.end)),
      $('<p>').addClass('muted faculty-spaced').text(`${modeLabel(slot)} · ${slot.location}`),
      $('<strong>').text(`${subject}${topic ? ` · ${topic}` : ''}`),
      $('<p>').addClass('muted faculty-spaced').text(topic ? description : 'No topic added.'),
    );

    if (children != null) {
      $card.append(children);
    }

    return $card;
  }

  FC.AppointmentSummary = AppointmentSummary;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
