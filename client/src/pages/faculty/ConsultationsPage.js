(function (FC, $) {
  'use strict';

  const {
    Avatar,
    PageHead,
    StatusBadge,
    createLink,
    getLocation,
    setSearchParams,
    STATUSES,
    getFacultyRecords,
    cap,
    fmtRange,
    fmtShort,
  } = FC;

  function createConsultationsPage() {
    const $root = $('<div>');

    const render = () => {
      const loc = getLocation();
      const records = getFacultyRecords();
      const status = loc.searchParams.get('status') || '';
      const list = records.filter((a) => !status || a.status === status);

      const $select = $('<select>')
        .attr('aria-label', 'Filter consultations by status')
        .append($('<option>').val('').text('All statuses'));
      for (const value of STATUSES) {
        $select.append($('<option>').val(value).text(cap(value)));
      }
      $select.val(status).on('change', (event) => {
        const { value } = event.target;
        setSearchParams(value ? { status: value } : {}, { state: loc.state });
      });

      const $section = $('<section>').addClass('card consultation-records').append(
        $('<h2>').text('All consultation records'),
        $('<p>').addClass('muted faculty-spaced').text('Pending, confirmed, completed, declined, and cancelled appointments.'),
      );

      if (!list.length) {
        $section.append(
          $('<div>').addClass('empty').append(
            $('<h3>').text('No consultations here'),
            $('<p>').addClass('muted').text('Try another status filter.'),
          ),
        );
      }

      for (const appointment of list) {
        $section.append(
          $('<div>').addClass('appt-row').append(
            $('<div>')
              .css({ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 })
              .append(
                Avatar({ person: appointment.student, size: 'sm' }),
                $('<div>').css('min-width', 0).append(
                  $('<strong>').text(`${appointment.student.name} · ${appointment.subject} · ${appointment.topic || 'No topic added'}`),
                  $('<span>').addClass('meta').text(`${fmtShort(appointment.slot.date)} · ${fmtRange(appointment.slot.start, appointment.slot.end)}`),
                ),
              ),
            StatusBadge({ status: appointment.status }),
            createLink(`/faculty/consultations/${appointment.id}`, 'View details', {
              className: 'btn',
              state: { returnTo: `/faculty/consultations?${loc.searchParams.toString()}` },
            }),
          ),
        );
      }

      $root.empty().append(
        PageHead({
          title: 'Consultations',
          subtitle: 'Review requests, manage upcoming consultations, and view previous appointment records.',
        }),
        $('<div>').addClass('filters').append($select),
        $section,
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

  FC.createConsultationsPage = createConsultationsPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
