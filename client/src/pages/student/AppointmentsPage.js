(function (FC, $) {
  'use strict';

  const {
    openAppointmentDialog,
    AppointmentGuidance,
    Avatar,
    PageHead,
    StatusBadge,
    createLink,
    getLocation,
    setSearchParams,
    canManageAppointment,
    isCurrentAppointment,
    STATUSES,
    getApp,
    getStudentRecords,
    fmtLong,
    fmtMonthDay,
    fmtRange,
    fmtTime,
    modeLabel,
  } = FC;

  function createAppointmentsPage() {
    let returnPosition = 0;
    let dialogModal = null;
    let listHeadingEl = null;
    let detailHeadingEl = null;

    const $root = $('<div>');

    const closeDialog = () => {
      if (dialogModal) {
        dialogModal.close({ restoreFocus: true });
        dialogModal = null;
      }
    };

    const render = () => {
      const loc = getLocation();
      const { now } = getApp();
      const mine = getStudentRecords();
      const params = loc.searchParams;
      const status = STATUSES.includes(params.get('status')) ? params.get('status') : '';

      const handleFilter = (key, value) => {
        const next = new URLSearchParams(params);
        next.delete('id');
        next.delete('scope');
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next, { state: loc.state });
      };

      const stamp = (a) => a.slot.date + a.slot.start;
      const current = mine
        .filter((a) => isCurrentAppointment(a, a.slot, now))
        .sort((a, b) => stamp(a).localeCompare(stamp(b)));
      const previous = mine
        .filter((a) => !isCurrentAppointment(a, a.slot, now))
        .sort((a, b) => stamp(b).localeCompare(stamp(a)));
      const pool = [...current, ...previous];
      const list = status ? pool.filter((a) => a.status === status) : pool;
      const sel = list.find((a) => a.id === params.get('id')) || list[0] || null;

      const handleSelect = (id) => {
        const next = new URLSearchParams(params);
        next.set('id', id);
        returnPosition = window.scrollY;
        setSearchParams(next, { state: loc.state });
        if (window.matchMedia('(max-width: 1100px)').matches) {
          requestAnimationFrame(() => {
            detailHeadingEl?.focus();
            detailHeadingEl?.scrollIntoView({ block: 'start' });
          });
        }
      };

      const handleBackToList = () => {
        listHeadingEl?.focus({ preventScroll: true });
        window.scrollTo(0, returnPosition);
      };

      const openDialog = (mode) => {
        if (!sel) return;
        closeDialog();
        dialogModal = openAppointmentDialog({
          appointment: sel,
          mode,
          onClose: () => closeDialog(),
          onSaved: (savedMode) => {
            dialogModal = null;
            if (savedMode === 'cancel' && status) {
              const next = new URLSearchParams(getLocation().searchParams);
              next.delete('status');
              next.set('id', sel.id);
              setSearchParams(next, { state: getLocation().state });
            }
          },
        });
      };

      const $filters = $('<div>')
        .addClass('filters')
        .attr({ role: 'group', 'aria-label': 'Appointment status', tabindex: '-1' });
      listHeadingEl = $filters[0];

      $filters.append(
        $('<button>')
          .attr({ type: 'button', 'aria-pressed': String(!status) })
          .text(`All statuses (${pool.length})`)
          .on('click', () => handleFilter('status', '')),
      );
      for (const category of STATUSES) {
        const count = pool.filter((a) => a.status === category).length;
        $filters.append(
          $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(status === category) })
            .text(`${category[0].toUpperCase() + category.slice(1)} (${count})`)
            .on('click', () => handleFilter('status', category)),
        );
      }

      const $listCol = $('<div>');
      if (list.length === 0) {
        $listCol.append(
          $('<div>')
            .addClass('card empty')
            .append(
              $('<h3>').text('No appointments here'),
              $('<p>')
                .addClass('muted')
                .append(
                  document.createTextNode('Try a different filter, or '),
                  createLink('/student/faculty', 'find a faculty member'),
                  document.createTextNode('.'),
                ),
            ),
        );
      }

      for (const a of list) {
        const isSelected = sel?.id === a.id;
        $listCol.append(
          $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(isSelected) })
            .addClass(`appt-row ${isSelected ? 'selected' : ''}`.trim())
            .append(
              $('<span>')
                .css({ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 })
                .append(
                  Avatar({ person: a.faculty, size: 'sm' }),
                  $('<span>')
                    .css('min-width', 0)
                    .append(
                      $('<strong>').text(a.faculty.name),
                      $('<span>')
                        .addClass('meta')
                        .text(`${fmtMonthDay(a.slot.date)} · ${fmtRange(a.slot.start, a.slot.end)} · ${a.subject}`),
                    ),
                ),
              $('<span>').append(StatusBadge({ status: a.status })),
            )
            .on('click', () => handleSelect(a.id)),
        );
      }

      const $workspace = $('<div>').addClass('two-col appointments-workspace').append($listCol);

      if (sel) {
        const $h3 = $('<h3>').attr('tabindex', '-1').text(sel.faculty.name);
        if (sel.faculty.pronouns) {
          $h3.append(
            $('<span>')
              .addClass('profile-pronouns')
              .css({ marginLeft: '6px', fontSize: '11px' })
              .text(sel.faculty.pronouns),
          );
        }
        detailHeadingEl = $h3[0];

        const $aside = $('<aside>')
          .addClass('card detail')
          .attr('aria-label', 'Appointment details')
          .append(
            StatusBadge({ status: sel.status }),
            $('<div>')
              .addClass('appointment-faculty')
              .append(
                Avatar({ person: sel.faculty, size: 'lg' }),
                $('<div>').append(
                  $h3,
                  $('<div>').addClass('muted small').text(`${sel.faculty.rank} · ${sel.faculty.department}`),
                  $('<div>').addClass('muted small').text(sel.faculty.office),
                ),
              ),
            $('<button>')
              .attr('type', 'button')
              .addClass('link-btn mobile-details-back')
              .text('← Back to appointment list')
              .on('click', handleBackToList),
            $('<div>').addClass('day').text(fmtLong(sel.slot.date)),
            $('<div>').addClass('time').text(`${fmtTime(sel.slot.start)}–${fmtTime(sel.slot.end)}`),
            $('<p>')
              .addClass('muted')
              .text(
                sel.slot.mode === 'online'
                  ? sel.slot.location || modeLabel(sel.slot)
                  : `${modeLabel(sel.slot)} · ${sel.slot.location}`,
              ),
          );

        const $guidance = AppointmentGuidance({
          status: sel.status,
          autoDeclined: sel.autoDeclined,
          slot: sel.slot,
        });
        if ($guidance) $aside.append($guidance);

        $aside.append(
          $('<hr>').addClass('divider'),
          $('<strong>').text(`${sel.subject}${sel.topic ? ` · ${sel.topic}` : ''}`),
          $('<p>')
            .addClass('muted')
            .css('margin-top', '8px')
            .text(sel.topic ? sel.description : 'No topic added.'),
        );

        if (canManageAppointment(sel, sel.slot, now)) {
          const $actions = $('<div>').addClass('actions').append(
            $('<button>')
              .attr('type', 'button')
              .addClass('btn block')
              .text(sel.topic ? 'Edit Topic' : 'Add a topic')
              .on('click', () => openDialog('edit')),
            $('<button>')
              .attr('type', 'button')
              .addClass('link-btn danger')
              .text('Cancel Appointment')
              .on('click', () => openDialog('cancel')),
            $('<p>')
              .addClass('muted small')
              .css('text-align', 'center')
              .text('Manage your consultation topic before the meeting.'),
          );
          if (sel.topic) {
            $actions.append(
              createLink(`/student/appointments/${sel.id}/delete-topic`, 'Delete topic', {
                css: { textAlign: 'center' },
              }),
            );
          }
          $aside.append($actions);
        } else {
          $aside.append(
            $('<p>')
              .addClass('muted small')
              .css('margin-top', '16px')
              .text('Editing is closed for this appointment.'),
          );
        }

        $workspace.append($aside);
      } else {
        detailHeadingEl = null;
      }

      $root.empty().append(
        PageHead({
          title: 'My appointments',
          subtitle: 'Review your current consultations and previous appointment records.',
        }),
        $filters,
        $workspace,
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
      destroy() {
        closeDialog();
      },
    };
  }

  FC.createAppointmentsPage = createAppointmentsPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
