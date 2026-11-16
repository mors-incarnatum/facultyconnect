(function (FC, $) {
  'use strict';

  const {
    Avatar,
    Field,
    PageHead,
    createWeekCalendar,
    departments,
    createLink,
    getLocation,
    navigate,
    setSearchParams,
    getApp,
    getFacultyResults,
    fmtLong,
    fmtRange,
    fmtShort,
    fmtTime,
    modeLabel,
  } = FC;

  function createFacultySearchPage({ view }) {
    let currentView = view;
    const initLoc = getLocation();
    let lastQueryKey = `${initLoc.searchParams.get('q') || ''}|${initLoc.searchParams.get('dept') || ''}`;
    let filters = {
      q: initLoc.searchParams.get('q') || '',
      dept: initLoc.searchParams.get('dept') || '',
    };
    let sameTime = [];
    let calendarCtrl = null;
    let previewEl = null;

    const $root = $('<div>');
    const $searchWrap = $('<div>');
    const $toolbarWrap = $('<div>');
    const $grid = $('<div>');
    const $mainCol = $('<div>');
    const $previewCol = $('<div>');

    const render = (opts = {}) => {
      const loc = getLocation();
      const { availableSlotsFor, getSlot, selection, setSelection, user } = getApp();
      const { q, dept, results } = getFacultyResults(loc.searchParams);
      const queryKey = `${q}|${dept}`;
      if (queryKey !== lastQueryKey) {
        lastQueryKey = queryKey;
        filters = { q, dept };
        sameTime = [];
      }

      const selFaculty =
        results.find((f) => f.id === (loc.searchParams.get('faculty') || selection.facultyId)) ||
        results[0] ||
        null;
      const options = selFaculty ? availableSlotsFor(selFaculty.id) : [];
      const chosen = getSlot(loc.searchParams.get('slot') || selection.slotId);
      const selSlot = options.find((s) => s.id === chosen?.id) || options[0] || null;
      const onward = { ...loc.state, returnTo: loc.pathname + loc.search };

      const choose = (facultyId, slotId) => {
        setSelection({ facultyId, slotId });
        const next = new URLSearchParams(loc.searchParams);
        next.set('faculty', facultyId);
        if (slotId) next.set('slot', slotId);
        else next.delete('slot');
        setSearchParams(next, { state: loc.state });
        if (window.matchMedia('(max-width: 1100px)').matches) {
          previewEl?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      };
      const pickFaculty = (f) => choose(f.id, availableSlotsFor(f.id)[0]?.id || null);
      const pickSlot = (s) => choose(s.facultyId, s.id);
      const handlePickSlots = (slots) => {
        sameTime = slots.length > 1 ? slots : [];
        pickSlot(slots[0]);
      };

      if (!opts.keepSearchForm || !$root.children().length) {
        const $details = $('<details>')
          .addClass(`faculty-search-options ${currentView === 'list' ? 'list-search-options' : ''}`.trim())
          .prop('open', currentView === 'list')
          .append($('<summary>').text('Search and filter faculty'));

        const $form = $('<form>').addClass('search-bar').attr('role', 'search');
        $form.append(
          Field({
            name: 'q',
            label: 'Search faculty',
            value: filters.q,
            placeholder: 'Search by name, department, or subject',
            onChange: (event) => {
              filters.q = event.target.value;
            },
          }),
          Field({
            name: 'dept',
            label: 'Department',
            as: 'select',
            value: filters.dept,
            children: [
              $('<option>').val('').text('All departments')[0],
              ...departments.map((d) => $('<option>').val(d).text(d)[0]),
            ],
            onChange: (event) => {
              filters.dept = event.target.value;
            },
          }),
          $('<button>').addClass('btn primary').attr('type', 'submit').text('Search'),
        );

        $form.on('submit', (event) => {
          event.preventDefault();
          const next = {};
          if (filters.q.trim()) next.q = filters.q.trim();
          if (filters.dept) next.dept = filters.dept;
          setSearchParams(next, { state: loc.state });
        });

        $details.append($form);
        $searchWrap.empty().append(
          PageHead({
            title: 'Find your academic guide',
            subtitle:
              currentView === 'list'
                ? 'Compare faculty, then choose a consultation time that works for you.'
                : 'Explore available times while keeping faculty details close at hand.',
          }),
          $details,
        );
      }

      $toolbarWrap.empty();
      if (currentView === 'list') {
        const $countLabel = $('<strong>')
          .addClass('muted small')
          .text(`${results.length} faculty · ${dept || 'All departments'}${q ? ` · “${q}”` : ''}`);
        const $toggle = $('<div>')
          .addClass('toggle auto')
          .attr({ role: 'group', 'aria-label': 'View' })
          .append(
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': 'true' })
              .text('List')
              .on('click', () => navigate(`/student/faculty${loc.search}`, { state: loc.state })),
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': 'false' })
              .text('Calendar')
              .on('click', () => navigate(`/student/faculty/calendar${loc.search}`, { state: loc.state })),
          );
        $toolbarWrap.append($('<div>').addClass('toolbar').append($countLabel, $toggle));
      }

      $grid.attr('class', `two-col ${currentView === 'list' ? 'faculty-directory' : 'calendar-directory'}`);

      if (results.length === 0) {
        calendarCtrl = null;
        $mainCol.empty().append(
          $('<div>').addClass('card empty').append(
            $('<h3>').text('No faculty match your search'),
            $('<p>').addClass('muted').text('Try a different name, subject, or department.'),
            $('<div>')
              .addClass('btn-row')
              .css('justify-content', 'center')
              .append(
                $('<button>')
                  .addClass('btn')
                  .text('Clear search')
                  .on('click', () => {
                    filters = { q: '', dept: '' };
                    setSearchParams({}, { state: loc.state });
                  }),
              ),
          ),
        );
      } else if (currentView === 'list') {
        calendarCtrl = null;
        $mainCol.empty();
        $mainCol.append(
          $('<div>').addClass('list-head').append($('<span>').text('Faculty'), $('<span>').text('Next available')),
        );
        for (const f of results) {
          const next = availableSlotsFor(f.id)[0];
          const selected = selFaculty?.id === f.id;
          const $whoText = $('<span>').css('min-width', 0);
          const $strong = $('<strong>').text(f.name);
          if (f.pronouns) {
            $strong.append($('<span>').addClass('profile-pronouns').css('margin-left', '6px').text(f.pronouns));
          }
          $whoText.append($strong, $('<span>').addClass('muted small').text(f.department));
          if (f.specialties) {
            $whoText.append(
              $('<span>')
                .addClass('muted small')
                .css({
                  display: 'block',
                  fontSize: '11px',
                  opacity: 0.85,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                })
                .text(f.specialties.slice(0, 2).join(' · ')),
            );
          }

          const $when = $('<span>').addClass('when');
          if (next) {
            $when.append(
              $('<strong>').text(`${fmtShort(next.date)} · ${fmtTime(next.start)}`),
              $('<span>').addClass('muted small').text(next.mode === 'online' ? 'Online consultation' : next.location),
            );
          } else {
            $when.append($('<span>').addClass('muted small').text('No open times'));
          }

          $mainCol.append(
            $('<button>')
              .attr({ type: 'button', 'aria-pressed': String(selected) })
              .addClass(`row ${selected ? 'selected' : ''}`.trim())
              .append(
                $('<span>').addClass('who').append(Avatar({ person: f }), $whoText),
                $when,
              )
              .on('click', () => pickFaculty(f)),
          );
        }
        $mainCol.append(
          $('<div>')
            .addClass('notice')
            .css('margin-top', '4px')
            .append(
              document.createTextNode('Choose a faculty member to see their consultation details.'),
              $('<div>').addClass('muted small').css('margin-top', '8px').text('Slots are checked again when you submit.'),
            ),
        );
      } else {
        const calProps = {
          className: 'availability-calendar',
          viewActions: () =>
            $('<div>')
              .addClass('toggle auto')
              .attr({ role: 'group', 'aria-label': 'View' })
              .append(
                $('<button>')
                  .attr('type', 'button')
                  .text('List')
                  .on('click', () => navigate(`/student/faculty${getLocation().search}`, { state: getLocation().state })),
                $('<button>')
                  .attr({ type: 'button', 'aria-pressed': 'true' })
                  .text('Calendar'),
              ),
          facultyIds: results.map((f) => f.id),
          studentId: user.id,
          pickedSlotId: selSlot?.id,
          onPick: handlePickSlots,
        };

        if (!calendarCtrl) {
          calendarCtrl = createWeekCalendar(calProps);
          $mainCol.empty().append(calendarCtrl.$el);
        } else {
          calendarCtrl.update(calProps);
          if (!$mainCol.find(calendarCtrl.$el).length) {
            $mainCol.empty().append(calendarCtrl.$el);
          }
        }

        $mainCol.children('.same-time-card, .calendar-coming-up').remove();

        if (sameTime.length > 1) {
          const $sameTimeBtnRow = $('<div>').addClass('btn-row').css('margin-top', '10px');
          for (const s of sameTime) {
            $sameTimeBtnRow.append(
              $('<button>')
                .addClass('btn sm')
                .text(results.find((f) => f.id === s.facultyId)?.name || '')
                .on('click', () => pickSlot(s)),
            );
          }
          $mainCol.append(
            $('<div>')
              .addClass('card tint same-time-card')
              .css('margin-top', '16px')
              .append($('<strong>').text('Available at the same time'), $sameTimeBtnRow),
          );
        }

        const upNext = results
          .flatMap((f) => availableSlotsFor(f.id).slice(0, 2).map((s) => ({ s, f })))
          .sort((a, b) => (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start))
          .slice(0, 3);

        const $nextWeek = $('<div>').addClass('next-week');
        if (upNext.length) {
          for (const { s, f } of upNext) {
            $nextWeek.append(
              $('<button>')
                .addClass('link-btn')
                .css('margin-right', '16px')
                .text(`${f.name.replace(/^(Dr\.|Prof\.)\s*/, '')} · ${fmtShort(s.date)} · ${fmtTime(s.start)}`)
                .on('click', () => pickSlot(s)),
            );
          }
        } else {
          $nextWeek.append($('<span>').addClass('muted').text('No open times for this search.'));
        }

        $mainCol.append(
          $('<details>')
            .addClass('calendar-coming-up')
            .append($('<summary>').text('Coming up'), $nextWeek),
        );
      }

      $previewCol.empty();
      previewEl = null;

      if (selFaculty && currentView === 'calendar') {
        const $aside = $('<aside>')
          .addClass('selected-slot-summary')
          .attr('aria-label', 'Selected consultation time');
        $aside.append(
          $('<div>').append(
            $('<strong>').text(
              `${selFaculty.name}${selSlot ? ` · ${fmtShort(selSlot.date)} · ${fmtRange(selSlot.start, selSlot.end)}` : ''}`,
            ),
            $('<p>').text(
              selSlot ? `${modeLabel(selSlot)} · ${selSlot.location}` : 'No open consultation times at the moment.',
            ),
          ),
        );
        if (selSlot) {
          $aside.append(
            createLink(`/student/request?slot=${selSlot.id}`, 'Continue →', {
              className: 'btn primary',
              state: onward,
              attrs: { 'aria-label': 'Request consultation →' },
            }),
          );
        }
        previewEl = $aside[0];
        $previewCol.append($aside);
      } else if (selFaculty) {
        const $aside = $('<aside>').addClass('card preview').attr('aria-label', 'Faculty profile');
        const $nameH3 = $('<h3>').text(selFaculty.name);
        if (selFaculty.pronouns) {
          $nameH3.append(
            $('<span>').addClass('profile-pronouns').css({ marginLeft: '6px', fontSize: '11px' }).text(selFaculty.pronouns),
          );
        }
        $aside.append(
          $('<div>').addClass('eyebrow').text('Faculty profile'),
          $('<div>').addClass('head').append(
            Avatar({ person: selFaculty, size: 'lg' }),
            $('<div>').append(
              $nameH3,
              $('<div>').addClass('muted small').text(selFaculty.rank),
              $('<strong>').text(selFaculty.department),
            ),
          ),
        );

        if (selFaculty.motto) {
          $aside.append(
            $('<p>')
              .addClass('profile-quote')
              .css({ fontSize: '12px', padding: '8px 12px', margin: '10px 0' })
              .text(`“${selFaculty.motto}”`),
          );
        }

        $aside.append(
          $('<p>')
            .addClass('muted')
            .css('margin', '8px 0')
            .append(
              document.createTextNode(selFaculty.subjects.join(' · ')),
              document.createElement('br'),
              document.createTextNode(selFaculty.courses.join(' and ')),
            ),
        );

        if (selFaculty.specialties) {
          const $tags = $('<div>').addClass('profile-tags').css('margin-bottom', '10px');
          for (const spec of selFaculty.specialties.slice(0, 3)) {
            $tags.append(
              $('<span>').addClass('profile-tag highlight').css({ fontSize: '11px', padding: '2px 8px' }).text(spec),
            );
          }
          $aside.append($tags);
        }

        if (selFaculty.consultationTip) {
          $aside.append(
            $('<div>')
              .addClass('profile-tip')
              .css({ padding: '8px 10px', fontSize: '12px', marginBottom: '12px' })
              .append(
                $('<span>').addClass('profile-tip-icon').css('font-size', '13px').attr('aria-hidden', 'true').text('💡'),
                $('<div>').append($('<strong>').text('Tip: '), document.createTextNode(selFaculty.consultationTip)),
              ),
          );
        }

        $aside.append($('<hr>').addClass('divider'));

        if (selSlot) {
          const $otherUl = $('<ul>');
          const otherSlots = options.filter((s) => s.id !== selSlot.id).slice(0, 4);
          for (const s of otherSlots) {
            $otherUl.append(
              $('<li>').append(
                $('<button>').text(`${fmtShort(s.date)} · ${fmtRange(s.start, s.end)}`).on('click', () => pickSlot(s)),
              ),
            );
          }
          if (options.length <= 1) {
            $otherUl.append($('<li>').addClass('muted small').text('No other times right now.'));
          }
          $aside.append(
            $('<span>').addClass('badge').text('Available'),
            $('<div>').addClass('when-big').text(fmtLong(selSlot.date)),
            $('<div>').addClass('time-big').text(fmtRange(selSlot.start, selSlot.end)),
            $('<p>')
              .addClass('muted')
              .css('margin-bottom', '16px')
              .append(
                document.createTextNode(`${modeLabel(selSlot)} · 30 minutes`),
                document.createElement('br'),
                document.createTextNode(selSlot.location),
              ),
            createLink(`/student/request?slot=${selSlot.id}`, 'Request consultation →', {
              className: 'btn primary block',
              state: onward,
            }),
            $('<div>').css('margin-top', '18px').append($('<strong>').text('Other available times'), $otherUl),
          );
        } else {
          $aside.append($('<div>').addClass('notice warn').text('No open consultation times at the moment.'));
        }

        $aside.append(
          $('<hr>').addClass('divider'),
          $('<p>').addClass('muted small').text('Pending requests reserve the selected slot until the faculty responds.'),
          $('<p>')
            .css('margin-top', '10px')
            .append(createLink(`/student/faculty/${selFaculty.id}`, 'View full profile →', { state: onward })),
        );

        previewEl = $aside[0];
        $previewCol.append($aside);
      }

      if (!$root.children().length) {
        $grid.append($mainCol, $previewCol);
        $root.append($searchWrap, $toolbarWrap, $grid);
      }
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        const nextView = nextCtx?.view || currentView;
        const viewChanged = nextView !== currentView;
        currentView = nextView;
        render({ keepSearchForm: !viewChanged });
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock') || reasons.has('selection')) {
          render({ keepSearchForm: true });
        }
      },
    };
  }

  FC.createFacultySearchPage = createFacultySearchPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
