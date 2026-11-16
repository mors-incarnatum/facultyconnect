(function (FC, $) {
  'use strict';

  const {
    AvailabilityTabs,
    Field,
    PageHead,
    PublishedSlotDay,
    createLink,
    getApp,
    hasEnded,
    isFutureSlot,
    addDays,
    fmtShort,
    weekStartOf,
  } = FC;

  const weekLabel = (start) =>
    `${fmtShort(start)} – ${fmtShort(addDays(start, 6))}, ${addDays(start, 6).slice(0, 4)}`;

  function createPublishedSlotsPage() {
    let filters = { date: '', status: '' };
    let selectedWeek = '';
    const $root = $('<div>');

    const render = () => {
      const { now, user, slots, holderOf, appointments } = getApp();
      const referencedSlotIds = new Set(appointments.map((appointment) => appointment.slotId));
      const list = slots
        .filter((slot) => slot.facultyId === user.id && !hasEnded(slot, now))
        .map((slot) => ({ slot, holder: holderOf(slot.id) }))
        .filter(
          ({ slot, holder }) =>
            (holder || isFutureSlot(slot, now)) &&
            (!filters.date || slot.date === filters.date) &&
            (!filters.status || (holder?.status || 'available') === filters.status),
        )
        .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start));

      const weeks = [...new Set(list.map(({ slot }) => weekStartOf(slot.date)))];
      const activeWeek = weeks.includes(selectedWeek) ? selectedWeek : weeks[0];
      const weekIndex = weeks.indexOf(activeWeek);

      const days = new Map();
      list
        .filter(({ slot }) => weekStartOf(slot.date) === activeWeek)
        .forEach((entry) => {
          const entries = days.get(entry.slot.date) || [];
          entries.push(entry);
          days.set(entry.slot.date, entries);
        });

      const handleFilterChange = (event) => {
        const { name, value } = event.target;
        filters[name] = value;
        selectedWeek = '';
        render();
      };

      const handleClearFilters = () => {
        filters = { date: '', status: '' };
        selectedWeek = '';
        render();
      };

      const $tabs = AvailabilityTabs({
        children: createLink('/faculty/availability?add=1', '+ Add availability', { className: 'btn primary' }),
      });

      const $filters = $('<div>').addClass('filters').append(
        Field({
          name: 'date',
          label: 'Filter slots by date',
          type: 'date',
          value: filters.date,
          onChange: handleFilterChange,
        }),
        Field({
          name: 'status',
          label: 'Filter slot status',
          as: 'select',
          value: filters.status,
          children: [
            $('<option>').val('').text('All statuses')[0],
            ...['available', 'pending', 'confirmed'].map((s) => $('<option>').val(s).text(s)[0]),
          ],
          onChange: handleFilterChange,
        }),
        $('<button>').addClass('btn').text('Clear filters').on('click', handleClearFilters),
      );

      const $section = $('<section>').addClass('card published-slots').append(
        $('<h2>').text('Published time slots'),
        $('<p>')
          .addClass('muted faculty-spaced')
          .text('Browse by week and expand a day to manage its slots. Each slot allows one appointment.'),
      );

      if (!list.length) {
        $section.append(
          $('<div>').addClass('empty').append(
            $('<h3>').text(filters.date || filters.status ? 'No matching slots' : 'No published slots'),
            $('<p>')
              .addClass('muted')
              .text(
                filters.date || filters.status
                  ? 'Try another date or status, or clear the filters.'
                  : 'Add a time or publish weekly hours to get started.',
              ),
          ),
        );
      }

      if (weeks.length > 0) {
        const $weekNav = $('<div>')
          .addClass('published-week-navigation')
          .attr({ role: 'group', 'aria-label': 'Published slot weeks' })
          .append(
            $('<button>')
              .addClass('btn')
              .prop('disabled', weekIndex === 0)
              .text('← Previous week')
              .on('click', () => {
                selectedWeek = weeks[weekIndex - 1];
                render();
              }),
            Field({
              name: 'publishedWeek',
              label: 'Published week',
              as: 'select',
              value: activeWeek,
              children: weeks.map((week) => $('<option>').val(week).text(weekLabel(week))[0]),
              onChange: (event) => {
                selectedWeek = event.target.value;
                render();
              },
            }),
            $('<button>')
              .addClass('btn')
              .prop('disabled', weekIndex === weeks.length - 1)
              .text('Next week →')
              .on('click', () => {
                selectedWeek = weeks[weekIndex + 1];
                render();
              }),
          );

        const $daysWrap = $('<div>').addClass('published-days');
        for (const [date, entries] of days) {
          $daysWrap.append(PublishedSlotDay({ date, entries, referencedSlotIds }));
        }

        $section.append(
          $weekNav,
          $('<p>')
            .addClass('muted small')
            .attr('role', 'status')
            .text(
              `Week ${weekIndex + 1} of ${weeks.length} with matching slots · ${list.length} ${list.length === 1 ? 'slot' : 'slots'} total`,
            ),
          $daysWrap,
        );
      }

      $root.empty().append(
        PageHead({
          title: 'My consultation availability',
          subtitle: 'Create, review, edit, or remove the dates and times students can request.',
        }),
        $tabs,
        $filters,
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

  FC.createPublishedSlotsPage = createPublishedSlotsPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
