(function (FC, $) {
  'use strict';

  const {
    Avatar,
    StatusBadge,
    createWeekCalendar,
    createLink,
    navigate,
    isCurrentAppointment,
    getApp,
    getStudentRecords,
    fmtRange,
    fmtShort,
  } = FC;

  function createStudentOverviewPage() {
    const $root = $('<div>');
    let calendarCtrl = null;

    const render = () => {
      const { now, user, faculty, setSelection } = getApp();
      const hour = now.getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      const mine = getStudentRecords();
      const count = (s) => mine.filter((a) => a.status === s).length;
      const upcoming = mine
        .filter((a) => isCurrentAppointment(a, a.slot, now))
        .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start))
        .slice(0, 3);

      const handlePickSlot = ([slot]) => {
        setSelection({ facultyId: slot.facultyId, slotId: slot.id });
        navigate(`/student/faculty/calendar?faculty=${slot.facultyId}&slot=${slot.id}`);
      };

      const $head = $('<div>')
        .addClass('page-head')
        .css({ display: 'flex', gap: '16px', alignItems: 'center' });
      $head.append(Avatar({ person: user, size: 'lg' }));

      const $h1 = $('<h1>').css('margin', 0).text(`${greeting}, ${user.name.split(' ')[0]}`);
      if (user.pronouns) {
        $h1.append(
          $('<span>')
            .addClass('profile-pronouns')
            .css({ marginLeft: '8px', fontSize: '13px', fontWeight: 500 })
            .text(user.pronouns),
        );
      }

      const $summary = $('<p>').css('margin', '4px 0 0').append(
        document.createTextNode(
          `${count('pending')} pending · ${count('confirmed')} confirmed · ${count('completed')} completed · ${count('declined')} declined · ${count('cancelled')} cancelled. `,
        ),
        createLink('/student/appointments', 'View every status in My appointments.'),
      );

      $head.append($('<div>').append($h1, $summary));

      const $upcomingCol = $('<section>').append(
        $('<h2>').addClass('section-title').text('Upcoming and ongoing consultations'),
      );
      const $upcomingContent = $('<div>').addClass('overview-section-content');
      if (!upcoming.length) {
        $upcomingContent.append(
          $('<div>').addClass('card empty').append(
            $('<h3>').text('Nothing scheduled'),
            $('<p>').addClass('muted').text('Find a faculty member to request your next consultation.'),
          ),
        );
      }
      for (const a of upcoming) {
        $upcomingContent.append(
          $('<div>').addClass('card upcoming-card').append(
            StatusBadge({ status: a.status }),
            $('<div>')
              .css({ display: 'flex', gap: '12px', alignItems: 'center', margin: '12px 0 8px' })
              .append(
                Avatar({ person: a.faculty, size: 'md' }),
                $('<div>').append(
                  $('<h3>').css({ margin: 0, fontSize: '18px' }).text(a.faculty.name),
                  $('<div>').addClass('muted small').text(`${a.faculty.rank} · ${a.faculty.department}`),
                ),
              ),
            $('<p>').addClass('when').text(`${fmtShort(a.slot.date)} · ${fmtRange(a.slot.start, a.slot.end)}`),
            $('<p>').addClass('muted').text(`${a.subject}${a.topic ? ` · ${a.topic}` : ''}`),
            createLink(`/student/appointments?id=${a.id}`, 'View appointment →', { className: 'btn block' }),
          ),
        );
      }
      $upcomingContent.append(
        $('<p>').css({ textAlign: 'center', marginTop: '20px' }).append(
          createLink('/student/appointments', 'All appointments →'),
        ),
      );
      $upcomingCol.append($upcomingContent);

      const calProps = {
        className: 'overview-calendar',
        facultyIds: faculty.map((f) => f.id),
        studentId: user.id,
        onPick: handlePickSlot,
      };
      if (!calendarCtrl) {
        calendarCtrl = createWeekCalendar(calProps);
      } else {
        calendarCtrl.update(calProps);
      }

      const $calendarCol = $('<section>').append(
        $('<h2>').addClass('section-title').text('Your week at a glance'),
        calendarCtrl.$el,
      );

      $root.empty().append(
        $head,
        $('<div>').addClass('overview-grid student-overview-grid').append($upcomingCol, $calendarCol),
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

  FC.createStudentOverviewPage = createStudentOverviewPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
