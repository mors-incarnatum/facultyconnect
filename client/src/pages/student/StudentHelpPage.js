(function (FC, $) {
  'use strict';

  const { PageHead } = FC;

  const STEPS = [
    ['Find faculty', 'Search by name, department, or subject, then compare open consultation times.'],
    ['Request a time', 'Pick a slot and say what you want to discuss. The slot is held for you while the faculty member reviews it.'],
    ['Track the status', 'Pending, confirmed, declined, completed, or cancelled: every status is shown in My appointments.'],
    ['Update or cancel', 'Edit or delete your topic, or cancel if you can no longer attend.'],
  ];

  function createStudentHelpPage() {
    const $stack = $('<div>').addClass('stack').css('max-width', '760px');
    STEPS.forEach(([title, description], i) => {
      $stack.append(
        $('<div>').addClass('card').append(
          $('<span>').addClass('badge').text(`Step ${i + 1}`),
          $('<h3>').css({ fontSize: '22px', margin: '10px 0 6px' }).text(title),
          $('<p>').addClass('muted').text(description),
        ),
      );
    });
    $stack.append($('<div>').addClass('notice').text('Need more help? Contact your CCS program coordinator.'));

    const $root = $('<div>').append(
      PageHead({
        title: 'Help & support',
        subtitle: 'A quick guide to how consultations work in FacultyConnect.',
      }),
      $stack,
    );

    return { $el: $root };
  }

  FC.createStudentHelpPage = createStudentHelpPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
