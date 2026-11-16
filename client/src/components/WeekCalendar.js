(function (FC, $) {
  'use strict';

  const {
    createLink,
    ACTIVE,
    getApp,
    addDays,
    addMinutes,
    fmtDayHeader,
    fmtLong,
    fmtRange,
    fmtShort,
    fmtTime,
    parseDate,
    weekStartOf,
    Avatar,
  } = FC;

  const PERIODS = {
    morning: { label: 'Morning · before noon', times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
    afternoon: { label: 'Afternoon / evening · noon onwards', times: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
  };

  const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const inPeriod = (slot, p) => (p === 'morning' ? slot.start < '12:00' : slot.start >= '12:00');
  const stripTitle = (name) => name.replace(/^(Dr\.|Prof\.)\s*/, '');

  function createWeekCalendar(initialProps) {
    let props = { ...initialProps };
    const initialApp = getApp();
    const initialAnchorSlot =
      initialApp.getSlot(props.pickedSlotId) ||
      initialApp.slots
        .filter((s) => props.facultyIds.includes(s.facultyId) && initialApp.isAvailable(s))
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];

    const state = {
      weekStart: weekStartOf(initialAnchorSlot?.date || initialApp.today),
      view: window.matchMedia('(max-width: 700px)').matches ? 'agenda' : 'calendar',
      displayMode: 'day',
      scope: 'all',
      sortBy: 'date',
      facultyFilter: '',
      fromDate: '',
      toDate: '',
      timeFilter: '',
      includeWeekend: false,
      period: initialAnchorSlot?.start && initialAnchorSlot.start >= '12:00' ? 'afternoon' : 'morning',
      selectedDate: initialAnchorSlot?.date || initialApp.today,
      selectedFacultyId: '',
      selectedDept: '',
    };

    let prevAnchorKey = `${props.pickedSlotId || ''}|${initialAnchorSlot?.date || ''}|${initialAnchorSlot?.start || ''}`;
    if (initialAnchorSlot?.date) {
      const weekday = new Date(`${initialAnchorSlot.date}T12:00:00`).getDay();
      if (weekday === 0 || weekday === 6) state.includeWeekend = true;
    }

    const $root = $('<div>');

    const buildTimePill = (slot, facultyName, pickedSlotId, onPick) => {
      const isSelected = slot.id === pickedSlotId;
      const $btn = $('<button>')
        .attr({
          type: 'button',
          'aria-pressed': String(isSelected),
          'aria-label': `Choose ${fmtRange(slot.start, slot.end)} with ${facultyName}`,
          title: `${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`,
        })
        .addClass(`agenda-time-pill ${isSelected ? 'selected' : ''}`.trim())
        .on('click', () => onPick([slot]));

      if (isSelected) {
        $btn.append($('<span>').attr('aria-hidden', 'true').text('✓ '));
      }
      $btn.append(document.createTextNode(fmtRange(slot.start, slot.end)));
      if (slot.mode === 'online') {
        $btn.append($('<span>').addClass('pill-mode').text('· Online'));
      }
      return $btn;
    };

    const buildFacultyDetails = (faculty, subText) => {
      const $details = $('<div>').addClass('agenda-faculty-details');
      const $nameWrap = $('<div>').addClass('agenda-faculty-name-wrap');
      $nameWrap.append($('<strong>').text(faculty.name));
      if (faculty.pronouns) {
        $nameWrap.append($('<span>').addClass('profile-pronouns').text(faculty.pronouns));
      }
      $details.append($nameWrap, $('<div>').addClass('agenda-faculty-sub').text(subText));
      return $details;
    };

    const buildGroupedFacultyCard = (fGroup, countSuffix, pickedSlotId, onPick) => {
      const $card = $('<article>').addClass('agenda-grouped-card');
      const subText = `${fGroup.faculty.rank ? `${fGroup.faculty.rank} · ` : ''}${fGroup.faculty.department} · ${fGroup.count} ${countSuffix}`;
      const $head = $('<div>')
        .addClass('agenda-grouped-head')
        .append(
          Avatar({ person: fGroup.faculty, size: 'md' }),
          buildFacultyDetails(fGroup.faculty, subText),
        );
      $card.append($head);

      for (const { date, slots: dateSlots } of fGroup.dates) {
        const $row = $('<div>').addClass('agenda-date-row');
        const locLabel = dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '');
        $row.append(
          $('<div>')
            .addClass('agenda-date-row-head')
            .append(
              $('<span>').addClass('agenda-date-row-title').text(fmtLong(date)),
              $('<span>').addClass('muted small').text(locLabel),
            ),
        );
        const $pills = $('<div>')
          .addClass('agenda-pills-wrap')
          .css({ marginTop: '6px', paddingTop: '0', borderTop: 'none' });
        for (const slot of dateSlots) {
          $pills.append(buildTimePill(slot, fGroup.faculty.name, pickedSlotId, onPick));
        }
        $row.append($pills);
        $card.append($row);
      }

      return $card;
    };

    const buildDayFacultyCard = (fItem, pillHeading, pickedSlotId, onPick) => {
      const primaryLocation = fItem.slots[0]?.location;
      const $card = $('<article>').addClass('agenda-faculty-card');
      const subText = `${fItem.faculty.rank ? `${fItem.faculty.rank} · ` : ''}${fItem.faculty.department}${primaryLocation ? ` · ${primaryLocation}` : ''}`;
      $card.append(
        $('<div>')
          .addClass('agenda-faculty-top')
          .append(
            Avatar({ person: fItem.faculty, size: 'md' }),
            buildFacultyDetails(fItem.faculty, subText),
          ),
      );
      const $pills = $('<div>')
        .addClass('agenda-pills-wrap')
        .attr({ role: 'group', 'aria-label': `Available times for ${fItem.faculty.name}` })
        .append($('<div>').addClass('agenda-pill-label').text(pillHeading));
      for (const slot of fItem.slots) {
        $pills.append(buildTimePill(slot, fItem.faculty.name, pickedSlotId, onPick));
      }
      $card.append($pills);
      return $card;
    };

    const render = () => {
      const { today, slots, appointments, getFaculty, getSlot, isAvailable } = getApp();
      const { facultyIds, studentId, onPick, pickedSlotId, title, viewActions, className = '' } = props;

      const startThisWeek = weekStartOf(today);
      const endThisWeek = addDays(startThisWeek, 6);
      const startNextWeek = addDays(startThisWeek, 7);
      const endNextWeek = addDays(startThisWeek, 13);

      const openSlots = slots
        .filter((s) => facultyIds.includes(s.facultyId) && isAvailable(s))
        .sort((a, b) => {
          const diff = (a.date + a.start).localeCompare(b.date + b.start);
          if (diff !== 0) return diff;
          return (getFaculty(a.facultyId)?.name || '').localeCompare(getFaculty(b.facultyId)?.name || '');
        });

      const anchorSlot = getSlot(pickedSlotId) || openSlots[0];
      const anchorKey = `${pickedSlotId || ''}|${anchorSlot?.date || ''}|${anchorSlot?.start || ''}`;
      if (anchorKey !== prevAnchorKey) {
        prevAnchorKey = anchorKey;
        if (anchorSlot?.date) {
          state.weekStart = weekStartOf(anchorSlot.date);
          state.selectedDate = anchorSlot.date;
          state.period = anchorSlot.start < '12:00' ? 'morning' : 'afternoon';
          const weekday = new Date(`${anchorSlot.date}T12:00:00`).getDay();
          if (weekday === 0 || weekday === 6) state.includeWeekend = true;
        }
      }

      const days = Array.from({ length: state.includeWeekend ? 7 : 5 }, (_, n) => addDays(state.weekStart, n));
      const weekDays = Array.from({ length: 7 }, (_, n) => addDays(state.weekStart, n));
      const countPeriod = (p) => openSlots.filter((s) => days.includes(s.date) && inPeriod(s, p)).length;
      const times = [
        ...new Set([
          ...PERIODS[state.period].times,
          ...slots
            .filter((s) => facultyIds.includes(s.facultyId) && days.includes(s.date) && inPeriod(s, state.period))
            .map((s) => s.start),
        ]),
      ].sort();

      const countThisWeek = openSlots.filter((s) => s.date >= startThisWeek && s.date <= endThisWeek).length;
      const countNextWeek = openSlots.filter((s) => s.date >= startNextWeek && s.date <= endNextWeek).length;

      const agenda = openSlots.filter((s) => {
        if (state.scope === 'this-week' && (s.date < startThisWeek || s.date > endThisWeek)) return false;
        if (state.scope === 'next-week' && (s.date < startNextWeek || s.date > endNextWeek)) return false;
        if (state.scope === 'custom') {
          if (state.fromDate && s.date < state.fromDate) return false;
          if (state.toDate && s.date > state.toDate) return false;
        }
        if (state.facultyFilter && s.facultyId !== state.facultyFilter) return false;
        if (state.timeFilter && !inPeriod(s, state.timeFilter)) return false;
        return true;
      });

      const slotsByDate = new Map();
      for (const slot of agenda) {
        slotsByDate.set(slot.date, (slotsByDate.get(slot.date) || 0) + 1);
      }

      const facultyOptions = facultyIds
        .map((id) => getFaculty(id))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      const clearFilters = () => {
        state.scope = 'all';
        state.sortBy = 'date';
        state.facultyFilter = '';
        state.timeFilter = '';
        state.fromDate = '';
        state.toDate = '';
      };

      const isFiltered =
        state.scope !== 'all' ||
        state.sortBy !== 'date' ||
        state.facultyFilter ||
        state.timeFilter ||
        state.fromDate ||
        state.toDate;

      const handleWeekNav = (delta) => {
        const nextStart = addDays(state.weekStart, delta * 7);
        state.weekStart = nextStart;
        const newDays = Array.from({ length: 7 }, (_, n) => addDays(nextStart, n));
        const firstAvailable = newDays.find((d) => (slotsByDate.get(d) || 0) > 0);
        state.selectedDate = firstAvailable || newDays[0];
        render();
      };

      const handleJumpThisWeek = () => {
        const thisStart = weekStartOf(today);
        state.weekStart = thisStart;
        const thisDays = Array.from({ length: 7 }, (_, n) => addDays(thisStart, n));
        const firstAvailable = thisDays.find((d) => (slotsByDate.get(d) || 0) > 0 && d >= today);
        state.selectedDate = firstAvailable || today;
        render();
      };

      const handleJumpNext = () => {
        const next = openSlots.find((s) => s.date >= today) || openSlots[0];
        if (!next) return;
        clearFilters();
        state.weekStart = weekStartOf(next.date);
        state.selectedDate = next.date;
        state.displayMode = 'day';
        state.period = next.start < '12:00' ? 'morning' : 'afternoon';
        onPick([next]);
      };

      const groupedByDate = (() => {
        const groups = [];
        const dateMap = new Map();
        for (const slot of agenda) {
          if (!dateMap.has(slot.date)) {
            const item = { date: slot.date, facultyMap: new Map(), count: 0 };
            dateMap.set(slot.date, item);
            groups.push(item);
          }
          const dayItem = dateMap.get(slot.date);
          dayItem.count += 1;
          if (!dayItem.facultyMap.has(slot.facultyId)) {
            dayItem.facultyMap.set(slot.facultyId, { faculty: getFaculty(slot.facultyId), slots: [] });
          }
          dayItem.facultyMap.get(slot.facultyId).slots.push(slot);
        }
        groups.sort((a, b) => a.date.localeCompare(b.date));
        for (const g of groups) {
          g.facultyList = Array.from(g.facultyMap.values()).sort((a, b) => {
            const diff = a.slots[0].start.localeCompare(b.slots[0].start);
            return diff !== 0 ? diff : (a.faculty?.name || '').localeCompare(b.faculty?.name || '');
          });
          for (const f of g.facultyList) {
            f.slots.sort((a, b) => a.start.localeCompare(b.start));
          }
        }
        return groups;
      })();

      const groupedByFaculty = (() => {
        const groups = [];
        const fMap = new Map();
        for (const slot of agenda) {
          if (!fMap.has(slot.facultyId)) {
            const item = { faculty: getFaculty(slot.facultyId), dateMap: new Map(), count: 0 };
            fMap.set(slot.facultyId, item);
            groups.push(item);
          }
          const fItem = fMap.get(slot.facultyId);
          fItem.count += 1;
          if (!fItem.dateMap.has(slot.date)) fItem.dateMap.set(slot.date, []);
          fItem.dateMap.get(slot.date).push(slot);
        }
        groups.sort((a, b) => (a.faculty?.name || '').localeCompare(b.faculty?.name || ''));
        for (const g of groups) {
          g.dates = Array.from(g.dateMap.entries())
            .map(([date, list]) => ({ date, slots: list.sort((a, b) => a.start.localeCompare(b.start)) }))
            .sort((a, b) => a.date.localeCompare(b.date));
        }
        return groups;
      })();

      const groupedByDept = (() => {
        const deptMap = new Map();
        for (const slot of agenda) {
          const f = getFaculty(slot.facultyId);
          const dept = f?.department || 'Other';
          if (!deptMap.has(dept)) deptMap.set(dept, new Map());
          const fInDept = deptMap.get(dept);
          if (!fInDept.has(slot.facultyId)) {
            fInDept.set(slot.facultyId, { faculty: f, dateMap: new Map(), count: 0 });
          }
          const fItem = fInDept.get(slot.facultyId);
          fItem.count += 1;
          if (!fItem.dateMap.has(slot.date)) fItem.dateMap.set(slot.date, []);
          fItem.dateMap.get(slot.date).push(slot);
        }
        return Array.from(deptMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([department, fInDept]) => {
            const facultyList = Array.from(fInDept.values())
              .sort((a, b) => (a.faculty?.name || '').localeCompare(b.faculty?.name || ''))
              .map((item) => ({
                faculty: item.faculty,
                count: item.count,
                dates: Array.from(item.dateMap.entries())
                  .map(([date, list]) => ({ date, slots: list.sort((a, b) => a.start.localeCompare(b.start)) }))
                  .sort((a, b) => a.date.localeCompare(b.date)),
              }));
            const totalDeptSlots = facultyList.reduce((acc, f) => acc + f.count, 0);
            return { department, facultyList, totalDeptSlots };
          });
      })();

      const activeDaySlots = agenda.filter((s) => s.date === state.selectedDate);
      const activeDayFaculty = (() => {
        const fMap = new Map();
        for (const slot of activeDaySlots) {
          if (!fMap.has(slot.facultyId)) {
            fMap.set(slot.facultyId, { faculty: getFaculty(slot.facultyId), slots: [] });
          }
          fMap.get(slot.facultyId).slots.push(slot);
        }
        return Array.from(fMap.values()).sort((a, b) => {
          const diff = a.slots[0].start.localeCompare(b.slots[0].start);
          return diff !== 0 ? diff : (a.faculty?.name || '').localeCompare(b.faculty?.name || '');
        });
      })();
      const nextAvailableDay = openSlots.find((s) => s.date > state.selectedDate)?.date;
      const currentFacultyGroup = groupedByFaculty.length
        ? groupedByFaculty.find((g) => g.faculty.id === state.selectedFacultyId) || groupedByFaculty[0]
        : null;
      const currentDeptGroup = groupedByDept.length
        ? groupedByDept.find((g) => g.department === state.selectedDept) || groupedByDept[0]
        : null;

      $root.attr('class', `card week ${className}`.trim()).empty();

      const $toolbar = $('<div>').addClass('toolbar');
      const $controls = $('<div>').addClass('calendar-view-controls');
      if (viewActions != null) {
        $controls.append(typeof viewActions === 'function' ? viewActions() : viewActions);
      }
      const $displayToggle = $('<div>')
        .addClass('toggle')
        .attr({ role: 'group', 'aria-label': 'Availability display' });
      for (const val of ['calendar', 'agenda']) {
        $displayToggle.append(
          $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(state.view === val) })
            .text(val === 'agenda' ? 'Agenda' : 'Week grid')
            .on('click', () => {
              state.view = val;
              render();
            }),
        );
      }
      $controls.append($displayToggle);
      $toolbar.append(
        $controls,
        $('<button>')
          .attr('type', 'button')
          .addClass('btn sm')
          .prop('disabled', !openSlots.length)
          .text('Next available time')
          .on('click', handleJumpNext),
      );
      $root.append($toolbar);

      if (state.view === 'agenda') {
        const $agenda = $('<div>').addClass('agenda-container');
        const $headerControls = $('<div>').addClass('agenda-header-controls');
        const $scopeRow = $('<div>').addClass('agenda-scope-row');
        const $scopePills = $('<div>')
          .addClass('agenda-scope-pills')
          .attr({ role: 'group', 'aria-label': 'Date range scope' });

        const scopes = [
          ['all', `All upcoming (${openSlots.length})`],
          ['this-week', `This week (${countThisWeek})`],
          ['next-week', `Next week (${countNextWeek})`],
        ];
        for (const [val, label] of scopes) {
          $scopePills.append(
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': String(state.scope === val) })
              .addClass(`agenda-scope-btn ${state.scope === val ? 'active' : ''}`.trim())
              .text(label)
              .on('click', () => {
                state.scope = val;
                if (val !== 'custom') {
                  state.fromDate = '';
                  state.toDate = '';
                }
                render();
              }),
          );
        }

        const $sortSelect = $('<select>')
          .attr('id', 'agenda-sort-select')
          .addClass('agenda-sort-select')
          .append(
            $('<option>').val('date').text('Date & time (soonest first)'),
            $('<option>').val('faculty').text('Faculty name (A–Z)'),
            $('<option>').val('department').text('Department'),
          )
          .val(state.sortBy)
          .on('change', (e) => {
            state.sortBy = e.target.value;
            render();
          });

        const $sortCtrl = $('<div>')
          .addClass('agenda-sort-control')
          .append($('<label>').attr('for', 'agenda-sort-select').text('Sort by:'), $sortSelect);

        $scopeRow.append($scopePills, $sortCtrl);

        const $filtersCard = $('<div>').addClass('agenda-filters-card');
        const $facultySelect = $('<select>')
          .attr('id', 'agenda-faculty-select')
          .append($('<option>').val('').text(`All faculty (${facultyOptions.length})`));
        for (const f of facultyOptions) {
          $facultySelect.append($('<option>').val(f.id).text(f.name));
        }
        $facultySelect.val(state.facultyFilter).on('change', (e) => {
          state.facultyFilter = e.target.value;
          render();
        });

        const $timeSelect = $('<select>')
          .attr('id', 'agenda-time-select')
          .append(
            $('<option>').val('').text('Any time'),
            $('<option>').val('morning').text('Morning (before 12 PM)'),
            $('<option>').val('afternoon').text('Afternoon (12 PM onwards)'),
          )
          .val(state.timeFilter)
          .on('change', (e) => {
            state.timeFilter = e.target.value;
            render();
          });

        const $fromInput = $('<input>')
          .attr({ id: 'agenda-from-date', type: 'date' })
          .val(state.fromDate)
          .on('change', (e) => {
            state.fromDate = e.target.value;
            state.scope = 'custom';
            render();
          });

        const $toInput = $('<input>')
          .attr({ id: 'agenda-to-date', type: 'date' })
          .val(state.toDate)
          .on('change', (e) => {
            state.toDate = e.target.value;
            state.scope = 'custom';
            render();
          });

        $filtersCard.append(
          $('<div>').addClass('agenda-filter-field').append($('<label>').attr('for', 'agenda-faculty-select').text('Faculty'), $facultySelect),
          $('<div>').addClass('agenda-filter-field').append($('<label>').attr('for', 'agenda-time-select').text('Time of day'), $timeSelect),
          $('<div>').addClass('agenda-filter-field').append($('<label>').attr('for', 'agenda-from-date').text('From date'), $fromInput),
          $('<div>').addClass('agenda-filter-field').append($('<label>').attr('for', 'agenda-to-date').text('Through date'), $toInput),
        );

        if (isFiltered) {
          $filtersCard.append(
            $('<button>')
              .attr({ type: 'button', title: 'Reset all filters and sort order' })
              .addClass('agenda-reset-btn')
              .text('Reset filters')
              .on('click', () => {
                clearFilters();
                render();
              }),
          );
        }

        $headerControls.append($scopeRow, $filtersCard);
        $agenda.append($headerControls);

        const $modeBar = $('<div>').addClass('agenda-view-mode-bar');
        const $weekNav = $('<div>').addClass('week-nav').css('gap', '6px').append(
          $('<button>').attr({ type: 'button', 'aria-label': 'Previous week' }).text('‹').on('click', () => handleWeekNav(-1)),
          $('<button>').attr('type', 'button').text('This week').on('click', handleJumpThisWeek),
          $('<button>').attr({ type: 'button', 'aria-label': 'Next week' }).text('›').on('click', () => handleWeekNav(1)),
          $('<span>')
            .addClass('muted small')
            .css({ marginLeft: '8px', fontWeight: 600 })
            .text(`${fmtShort(state.weekStart)} – ${fmtShort(addDays(state.weekStart, 6))}`),
        );
        const $styleToggle = $('<div>')
          .addClass('toggle sm auto')
          .attr({ role: 'group', 'aria-label': 'Display style' })
          .append(
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': String(state.displayMode === 'day'), title: 'Single day view (zero scrolling)' })
              .text('Day by day')
              .on('click', () => {
                state.displayMode = 'day';
                render();
              }),
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': String(state.displayMode === 'all'), title: 'View all days in list' })
              .text('All days')
              .on('click', () => {
                state.displayMode = 'all';
                render();
              }),
          );
        $modeBar.append($weekNav, $styleToggle);
        $agenda.append($modeBar);

        if (state.displayMode === 'day' && state.sortBy === 'date') {
          const $strip = $('<div>').addClass('agenda-day-strip').attr({ role: 'group', 'aria-label': 'Select day' });
          for (const day of weekDays) {
            const dateObj = parseDate(day);
            const dow = DOW_NAMES[dateObj.getDay()];
            const num = dateObj.getDate();
            const slotCount = slotsByDate.get(day) || 0;
            const isSelected = day === state.selectedDate;
            const isToday = day === today;
            const $tab = $('<button>')
              .attr({
                type: 'button',
                'aria-pressed': String(isSelected),
                title: `${fmtLong(day)} · ${slotCount} available`,
              })
              .addClass(
                `agenda-day-tab ${isSelected ? 'selected' : ''} ${slotCount === 0 ? 'empty' : ''} ${isToday ? 'today' : ''}`.trim(),
              )
              .on('click', () => {
                state.selectedDate = day;
                render();
              })
              .append(
                $('<span>').addClass('agenda-tab-dow').text(dow),
                $('<span>').addClass('agenda-tab-num').text(String(num)),
                $('<span>').addClass('agenda-tab-count').text(slotCount > 0 ? `${slotCount} open` : '—'),
              );
            if (isToday) $tab.append($('<span>').addClass('agenda-tab-today-dot').attr('title', 'Today'));
            $strip.append($tab);
          }
          $agenda.append($strip);

          const $stepper = $('<div>').addClass('agenda-day-stepper');
          $stepper.append(
            $('<button>')
              .attr({ type: 'button', 'aria-label': 'Previous day' })
              .addClass('agenda-stepper-btn')
              .text(`‹ ${fmtShort(addDays(state.selectedDate, -1))}`)
              .on('click', () => {
                const prev = addDays(state.selectedDate, -1);
                state.selectedDate = prev;
                if (!weekDays.includes(prev)) state.weekStart = weekStartOf(prev);
                render();
              }),
          );
          const $cur = $('<div>')
            .addClass('agenda-stepper-current')
            .append($('<strong>').text(`${fmtLong(state.selectedDate)}, ${state.selectedDate.split('-')[0]}`));
          if (state.selectedDate === today) {
            $cur.append($('<span>').addClass('agenda-today-tag').text('Today'));
          }
          $cur.append($('<span>').addClass('muted small').text(`(${activeDaySlots.length} available)`));
          $stepper.append(
            $cur,
            $('<button>')
              .attr({ type: 'button', 'aria-label': 'Next day' })
              .addClass('agenda-stepper-btn')
              .text(`${fmtShort(addDays(state.selectedDate, 1))} ›`)
              .on('click', () => {
                const next = addDays(state.selectedDate, 1);
                state.selectedDate = next;
                if (!weekDays.includes(next)) state.weekStart = weekStartOf(next);
                render();
              }),
          );
          $agenda.append($stepper);

          if (activeDayFaculty.length > 0) {
            const $list = $('<div>').addClass('agenda-faculty-list');
            for (const fItem of activeDayFaculty) {
              $list.append(buildDayFacultyCard(fItem, 'Available times:', pickedSlotId, onPick));
            }
            $agenda.append($list);
          } else {
            const $emptyDay = $('<div>')
              .addClass('agenda-day-empty')
              .append($('<p>').addClass('muted').text(`No consultation times available on ${fmtLong(state.selectedDate)}.`));
            if (nextAvailableDay) {
              $emptyDay.append(
                $('<button>')
                  .attr('type', 'button')
                  .addClass('btn sm')
                  .text(`Jump to next available: ${fmtShort(nextAvailableDay)} (${slotsByDate.get(nextAvailableDay) || 0} open) →`)
                  .on('click', () => {
                    state.selectedDate = nextAvailableDay;
                    if (!weekDays.includes(nextAvailableDay)) state.weekStart = weekStartOf(nextAvailableDay);
                    render();
                  }),
              );
            }
            $agenda.append($emptyDay);
          }
        }

        if (state.displayMode === 'day' && state.sortBy === 'faculty' && currentFacultyGroup) {
          const $strip = $('<div>').addClass('agenda-entity-strip').attr({ role: 'group', 'aria-label': 'Select faculty' });
          for (const fg of groupedByFaculty) {
            const isSel = fg.faculty.id === currentFacultyGroup.faculty.id;
            $strip.append(
              $('<button>')
                .attr({ type: 'button', 'aria-pressed': String(isSel) })
                .addClass(`agenda-entity-tab ${isSel ? 'selected' : ''}`.trim())
                .append(
                  $('<span>').text(stripTitle(fg.faculty.name)),
                  $('<span>').addClass('tab-badge').text(String(fg.count)),
                )
                .on('click', () => {
                  state.selectedFacultyId = fg.faculty.id;
                  render();
                }),
            );
          }
          $agenda.append(
            $strip,
            buildGroupedFacultyCard(currentFacultyGroup, 'available times', pickedSlotId, onPick),
          );
        }

        if (state.displayMode === 'day' && state.sortBy === 'department' && currentDeptGroup) {
          const $strip = $('<div>').addClass('agenda-entity-strip').attr({ role: 'group', 'aria-label': 'Select department' });
          for (const dg of groupedByDept) {
            const isSel = dg.department === currentDeptGroup.department;
            $strip.append(
              $('<button>')
                .attr({ type: 'button', 'aria-pressed': String(isSel) })
                .addClass(`agenda-entity-tab ${isSel ? 'selected' : ''}`.trim())
                .append(
                  $('<span>').text(dg.department),
                  $('<span>').addClass('tab-badge').text(String(dg.totalDeptSlots)),
                )
                .on('click', () => {
                  state.selectedDept = dg.department;
                  render();
                }),
            );
          }
          const $deptSection = $('<div>').addClass('agenda-dept-section');
          for (const fGroup of currentDeptGroup.facultyList) {
            const subText = `${fGroup.faculty.rank || 'Faculty'} · ${fGroup.count} available times`;
            const $card = $('<article>').addClass('agenda-grouped-card');
            $card.append(
              $('<div>')
                .addClass('agenda-grouped-head')
                .append(Avatar({ person: fGroup.faculty, size: 'md' }), buildFacultyDetails(fGroup.faculty, subText)),
            );
            for (const { date, slots: dateSlots } of fGroup.dates) {
              const $row = $('<div>').addClass('agenda-date-row');
              const locLabel = dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '');
              $row.append(
                $('<div>').addClass('agenda-date-row-head').append(
                  $('<span>').addClass('agenda-date-row-title').text(fmtLong(date)),
                  $('<span>').addClass('muted small').text(locLabel),
                ),
              );
              const $pills = $('<div>')
                .addClass('agenda-pills-wrap')
                .css({ marginTop: '6px', paddingTop: '0', borderTop: 'none' });
              for (const slot of dateSlots) {
                $pills.append(buildTimePill(slot, fGroup.faculty.name, pickedSlotId, onPick));
              }
              $row.append($pills);
              $card.append($row);
            }
            $deptSection.append($card);
          }
          $agenda.append($strip, $deptSection);
        }

        if (state.displayMode === 'all') {
          const $allScroll = $('<div>').addClass('agenda-all-days-scroll');
          if (state.sortBy === 'date') {
            for (const group of groupedByDate) {
              const $section = $('<section>').addClass('agenda-day-group').attr('aria-label', fmtLong(group.date));
              const $titleRow = $('<div>')
                .addClass('agenda-day-title-row')
                .append($('<h3>').addClass('agenda-day-title').text(`${fmtLong(group.date)}, ${group.date.split('-')[0]}`));
              if (group.date === today) {
                $titleRow.append($('<span>').addClass('agenda-today-tag').text('Today'));
              }
              $section.append(
                $('<div>')
                  .addClass('agenda-day-header')
                  .append(
                    $titleRow,
                    $('<span>')
                      .addClass('agenda-day-count')
                      .text(`${group.count} ${group.count === 1 ? 'time' : 'times'} available`),
                  ),
              );
              const $fList = $('<div>').addClass('agenda-faculty-list');
              for (const fItem of group.facultyList) {
                $fList.append(buildDayFacultyCard(fItem, 'Available consultation slots:', pickedSlotId, onPick));
              }
              $section.append($fList);
              $allScroll.append($section);
            }
          }
          if (state.sortBy === 'faculty') {
            for (const fGroup of groupedByFaculty) {
              $allScroll.append(
                buildGroupedFacultyCard(
                  fGroup,
                  `available ${fGroup.count === 1 ? 'time' : 'times'}`,
                  pickedSlotId,
                  onPick,
                ),
              );
            }
          }
          if (state.sortBy === 'department') {
            for (const { department, facultyList, totalDeptSlots } of groupedByDept) {
              const $deptSection = $('<section>').addClass('agenda-dept-section');
              $deptSection.append(
                $('<div>')
                  .addClass('agenda-dept-header')
                  .append(
                    document.createTextNode(`${department} · `),
                    $('<span>')
                      .addClass('muted small')
                      .css('font-weight', 500)
                      .text(`${totalDeptSlots} available ${totalDeptSlots === 1 ? 'time' : 'times'}`),
                  ),
              );
              for (const fGroup of facultyList) {
                const subText = `${fGroup.faculty.rank || 'Faculty'} · ${fGroup.count} available ${fGroup.count === 1 ? 'time' : 'times'}`;
                const $card = $('<article>').addClass('agenda-grouped-card');
                $card.append(
                  $('<div>')
                    .addClass('agenda-grouped-head')
                    .append(Avatar({ person: fGroup.faculty, size: 'md' }), buildFacultyDetails(fGroup.faculty, subText)),
                );
                for (const { date, slots: dateSlots } of fGroup.dates) {
                  const $row = $('<div>').addClass('agenda-date-row');
                  const locLabel = dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '');
                  $row.append(
                    $('<div>').addClass('agenda-date-row-head').append(
                      $('<span>').addClass('agenda-date-row-title').text(fmtLong(date)),
                      $('<span>').addClass('muted small').text(locLabel),
                    ),
                  );
                  const $pills = $('<div>')
                    .addClass('agenda-pills-wrap')
                    .css({ marginTop: '6px', paddingTop: '0', borderTop: 'none' });
                  for (const slot of dateSlots) {
                    $pills.append(buildTimePill(slot, fGroup.faculty.name, pickedSlotId, onPick));
                  }
                  $row.append($pills);
                  $card.append($row);
                }
                $deptSection.append($card);
              }
              $allScroll.append($deptSection);
            }
          }
          $agenda.append($allScroll);
        }

        if (!agenda.length) {
          const $empty = $('<div>')
            .addClass('card empty')
            .css('margin-top', '16px')
            .append(
              $('<h3>').text('No available times match your filters'),
              $('<p>')
                .addClass('muted')
                .text(
                  openSlots.length
                    ? 'Try adjusting your date scope, faculty, or time of day filter.'
                    : 'No available times for the current faculty search.',
                ),
            );
          if (isFiltered) {
            $empty.append(
              $('<div>')
                .addClass('btn-row')
                .css('justify-content', 'center')
                .append(
                  $('<button>')
                    .attr('type', 'button')
                    .addClass('btn sm')
                    .text('Clear all filters')
                    .on('click', () => {
                      clearFilters();
                      render();
                    }),
                ),
            );
          }
          $agenda.append($empty);
        }

        $root.append($agenda);
      } else {
        const cells = {};
        for (const slot of slots) {
          if (!facultyIds.includes(slot.facultyId) || !days.includes(slot.date)) continue;
          const holder = appointments.find((a) => a.slotId === slot.id && ACTIVE.includes(a.status));
          if (!holder && !isAvailable(slot)) continue;
          const type = holder?.studentId === studentId ? 'own' : holder ? 'reserved' : 'open';
          const key = `${slot.date}|${slot.start}`;
          (cells[key] ||= []).push({ type, slot, appt: holder });
        }

        const renderCell = (day, time) => {
          const items = cells[`${day}|${time}`];
          if (!items) return null;
          const own = items.find((i) => i.type === 'own');
          if (own) {
            const f = getFaculty(own.slot.facultyId);
            const $linkContent = $([
              document.createTextNode(stripTitle(f.name)),
              document.createElement('br'),
              document.createTextNode(`${fmtTime(own.slot.start, false)} · ${own.appt.status === 'confirmed' ? 'Confirmed' : 'Pending'}`),
            ]);
            return createLink(`/student/appointments?id=${own.appt.id}`, $linkContent, {
              className: `cal-item own ${own.appt.status}`,
            });
          }
          const open = items.filter((i) => i.type === 'open');
          if (open.length) {
            const first = open[0].slot;
            const picked = open.some((i) => i.slot.id === pickedSlotId);
            const $btn = $('<button>')
              .attr({
                type: 'button',
                'aria-pressed': String(picked),
                'aria-label': `${open.length} faculty available ${day} ${fmtTime(first.start)}`,
              })
              .addClass(`cal-item ${picked ? 'picked' : ''}`.trim())
              .on('click', () => onPick(open.map((i) => i.slot)));
            if (picked) $btn.append($('<span>').attr('aria-hidden', 'true').text('✓ '));
            $btn.append(document.createTextNode(fmtRange(first.start, addMinutes(first.start, 30))));
            if (open.length > 1) {
              $btn.append($('<span>').addClass('slot-faculty-count').text(`${open.length} faculty available`));
            }
            return $btn;
          }
          return $('<div>')
            .addClass('cal-item reserved static')
            .append(
              document.createTextNode('Reserved'),
              document.createElement('br'),
              document.createTextNode(`${fmtTime(items[0].slot.start, false)} · Not bookable`),
            );
        };

        const $weekHead = $('<div>').addClass('week-head').append(
          $('<h3>').text(title || `${fmtShort(state.weekStart)} – ${fmtShort(addDays(state.weekStart, state.includeWeekend ? 6 : 4))}`),
          $('<div>').addClass('week-nav').append(
            $('<button>').attr({ type: 'button', 'aria-label': 'Previous week' }).text('‹').on('click', () => {
              state.weekStart = addDays(state.weekStart, -7);
              render();
            }),
            $('<button>').attr('type', 'button').text('This week').on('click', () => {
              state.weekStart = weekStartOf(today);
              render();
            }),
            $('<button>').attr({ type: 'button', 'aria-label': 'Next week' }).text('›').on('click', () => {
              state.weekStart = addDays(state.weekStart, 7);
              render();
            }),
          ),
        );

        const $periodToggle = $('<div>').addClass('period-toggle');
        for (const p of Object.keys(PERIODS)) {
          $periodToggle.append(
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': String(state.period === p) })
              .text(`${p === 'morning' ? 'Morning' : 'Afternoon'} (${countPeriod(p)})`)
              .on('click', () => {
                state.period = p;
                render();
              }),
          );
        }

        const $weekPeriod = $('<div>').addClass('week-period').append(
          $('<span>').text(
            `${title ? `${fmtShort(state.weekStart)} – ${fmtShort(addDays(state.weekStart, 6))} · ` : ''}${PERIODS[state.period].label}`,
          ),
          $periodToggle,
        );

        $root.append($weekHead, $weekPeriod);

        if (countPeriod(state.period) === 0) {
          $root.append(
            $('<p>')
              .addClass('notice')
              .attr('role', 'status')
              .text(
                !openSlots.length
                  ? 'No available times for the current faculty search.'
                  : `No available times in this period. ${countPeriod(state.period === 'morning' ? 'afternoon' : 'morning')} available in the other period this week. Use Next available time or Agenda to see more.`,
              ),
          );
        }

        const $calDays = $('<div>')
          .addClass(`calendar-days ${state.includeWeekend ? 'full-week' : ''}`.trim())
          .attr({ role: 'group', 'aria-label': 'Weekly availability' });

        for (const day of days) {
          const dayTimes = times.filter((t) => cells[`${day}|${t}`]?.length);
          const $daySec = $('<section>').addClass('calendar-day').attr('aria-label', fmtDayHeader(day));
          $daySec.append(
            $('<h4>').addClass(`calendar-day-heading ${day === today ? 'today' : ''}`.trim()).text(fmtDayHeader(day)),
            $('<p>').addClass('calendar-period-label').text(state.period === 'morning' ? 'Morning' : 'Afternoon'),
          );
          for (const t of dayTimes) {
            $daySec.append($('<div>').addClass('calendar-slot').append(renderCell(day, t)));
          }
          if (!dayTimes.length) {
            $daySec.append($('<p>').addClass('muted small calendar-empty').text('No times in this period'));
          }
          $calDays.append($daySec);
        }

        $root.append(
          $('<div>').addClass('cal-scroll').append($calDays),
          $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(state.includeWeekend) })
            .addClass('link-btn weekend-toggle')
            .text(state.includeWeekend ? 'Show weekdays only' : 'Include weekend')
            .on('click', () => {
              state.includeWeekend = !state.includeWeekend;
              render();
            }),
        );
      }

      const $legend = $('<div>').addClass('legend').append(
        $('<span>').append($('<i>').css('background', 'var(--green-100)'), document.createTextNode('Available')),
        $('<span>').append($('<i>').css({ background: '#f1efe6', border: '1px solid var(--line)' }), document.createTextNode('Confirmed')),
        $('<span>').append($('<i>').css('background', 'var(--amber-bg)'), document.createTextNode('Reserved / pending')),
      );
      $root.append($legend);
    };

    render();

    return {
      $el: $root,
      update(nextProps) {
        props = { ...props, ...nextProps };
        render();
      },
    };
  }

  FC.createWeekCalendar = createWeekCalendar;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
