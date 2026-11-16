(function (FC, $) {
  'use strict';

  const {
    Avatar,
    PageHead,
    StatusActions,
    StatusBadge,
    createLink,
    STATUSES,
    isCurrentAppointment,
    getApp,
    getFacultyRecords,
    cap,
    fmtRange,
    fmtShort,
  } = FC;

  function createFacultyOverviewPage() {
    const $root = $('<div>');

    const render = () => {
      const { now, user } = getApp();
      const records = getFacultyRecords();
      const pending = records.filter((a) => a.status === 'pending');
      const upcoming = records.filter((a) => a.status === 'confirmed' && isCurrentAppointment(a, a.slot, now));

      const $welcome = $('<div>').addClass('faculty-welcome').append(
        Avatar({ person: user, size: 'lg' }),
        $('<div>').append(
          PageHead({
            title: `Welcome back, ${user.name}`,
            subtitle: `${user.rank || 'Faculty'} · ${user.department}`,
          }),
        ),
      );

      const $stats = $('<div>').addClass('stat-grid faculty-stats');
      for (const status of STATUSES) {
        const count = records.filter((a) => a.status === status).length;
        $stats.append(
          createLink(
            `/faculty/consultations?status=${status}`,
            $([
              $('<span>').text(cap(status))[0],
              $('<b>').text(String(count))[0],
            ]),
            { className: 'stat' },
          ),
        );
      }

      const $pendingSection = $('<section>').addClass('card').append(
        $('<h2>').addClass('section-title').text('Pending requests'),
      );
      if (!pending.length) {
        $pendingSection.append($('<p>').addClass('muted').text("You're all caught up. No pending requests."));
      }
      for (const appointment of pending) {
        const $personH3 = $('<h3>').text(
          `${appointment.student.name}${appointment.student.pronouns ? ` · ${appointment.student.pronouns}` : ''}`,
        );
        $pendingSection.append(
          $('<article>').addClass('req-card').append(
            StatusBadge({ status: appointment.status }),
            $('<div>').addClass('request-person').append(
              Avatar({ person: appointment.student, size: 'md' }),
              $('<div>').append(
                $personH3,
                $('<div>').addClass('muted small').text(appointment.student.program || 'Student'),
              ),
            ),
            $('<p>').addClass('when').text(`${fmtShort(appointment.slot.date)} · ${fmtRange(appointment.slot.start, appointment.slot.end)}`),
            $('<div>').addClass('topic').append(
              $('<strong>').text(`${appointment.subject} · ${appointment.topic || 'No topic added'}`),
              $('<p>').addClass('muted').text(appointment.description || ''),
            ),
            StatusActions({ appointment, compact: true }),
            $('<p>').addClass('faculty-spaced').append(
              createLink(`/faculty/consultations/${appointment.id}`, 'View full request →', { className: 'btn block' }),
            ),
          ),
        );
      }

      const $upcomingSection = $('<section>').addClass('card').append(
        $('<h2>').addClass('section-title').text('Upcoming and ongoing consultations'),
      );
      if (!upcoming.length) {
        $upcomingSection.append($('<p>').addClass('muted').text('No confirmed consultations yet.'));
      }
      for (const appointment of upcoming) {
        $upcomingSection.append(
          $('<article>').addClass('req-card').append(
            StatusBadge({ status: appointment.status }),
            $('<div>').addClass('request-person').append(
              Avatar({ person: appointment.student, size: 'md' }),
              $('<div>').append(
                $('<h3>').text(`${appointment.student.name} · ${appointment.subject}`),
                $('<div>').addClass('muted small').text(appointment.student.program || 'Student'),
              ),
            ),
            $('<p>')
              .addClass('muted')
              .append(
                document.createTextNode(`${fmtShort(appointment.slot.date)} · ${fmtRange(appointment.slot.start, appointment.slot.end)}`),
                document.createElement('br'),
                document.createTextNode(appointment.slot.location),
              ),
            $('<p>').addClass('faculty-spaced').text(`Topic: ${appointment.topic || 'No topic added'}`),
            createLink(`/faculty/consultations/${appointment.id}`, 'Manage consultation →', { className: 'btn block' }),
          ),
        );
      }

      $upcomingSection.append(
        $('<hr>').addClass('divider'),
        $('<h2>').text('Availability'),
        $('<p>').addClass('muted faculty-spaced').text('Publish the dates and time slots students can request.'),
        createLink('/faculty/availability', 'Manage my availability →', { className: 'btn primary block' }),
      );

      $root.empty().append(
        $welcome,
        $stats,
        $('<div>').addClass('faculty-dashboard').append($pendingSection, $upcomingSection),
      );
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock') || reasons.has('auth')) {
          render();
        }
      },
    };
  }

  FC.createFacultyOverviewPage = createFacultyOverviewPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
