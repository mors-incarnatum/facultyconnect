(function (FC, $) {
  'use strict';

  const { PageHead } = FC;

  const STEPS = [
    ['Publish your availability', 'Set weekly hours, publication horizon (1–16 weeks), and date exceptions in the availability manager, or add a one-off 30-minute slot. Save changes publishes your selected weeks.'],
    ['Review requests', 'Open a pending request to read the student’s course, topic, and description. Accept or decline it from the overview or consultation details.'],
    ['Manage consultations', 'Mark consultations completed or cancelled. The shared appointment status appears in both workspaces.'],
    ['Keep occupied slots protected', 'Pending and confirmed slots cannot be edited or removed. Previous consultation records retain their original schedule.'],
  ];

  function createFacultyHelpPage() {
    const $stack = $('<div>').addClass('stack faculty-help');
    STEPS.forEach(([title, description], i) => {
      $stack.append(
        $('<section>').addClass('card').append(
          $('<span>').addClass('badge').text(`Step ${i + 1}`),
          $('<h2>').addClass('faculty-spaced').text(title),
          $('<p>').addClass('muted').text(description),
        ),
      );
    });
    $stack.append($('<div>').addClass('notice').text('Need more help? Contact your CCS program coordinator.'));

    const $root = $('<div>').append(
      PageHead({
        title: 'Help & support',
        subtitle: 'A quick guide to managing consultations in FacultyConnect.',
      }),
      $stack,
    );

    return { $el: $root };
  }

  FC.createFacultyHelpPage = createFacultyHelpPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
