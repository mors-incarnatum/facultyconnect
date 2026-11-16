(function (FC, $) {
  'use strict';

  const {
    AvailabilityTabs,
    Field,
    openModal,
    PageHead,
    getLocation,
    intervalsOf,
    getApp,
    addDays,
    addMinutes,
    fmtShort,
  } = FC;

  function createAvailabilityPage() {
    const initApp = getApp();
    const initLoc = getLocation();
    let date = initApp.today;
    let endDate = initApp.today;
    let activeCopyDay = null;
    let copyTargetDays = [];
    let error = '';

    let showAddModal =
      initLoc.searchParams.has('add') ||
      initLoc.hash === '#add-slot' ||
      window.location.search.includes('add=') ||
      window.location.hash.endsWith('#add-slot');
    let slotForm = null;
    let addModalInstance = null;

    const $root = $('<div>');
    let $scheduleStateEl = null;
    let $discardBtnEl = null;
    let $draftStatusEl = null;
    let $errorAlertEl = null;

    const closeAddModal = () => {
      showAddModal = false;
      if (addModalInstance) {
        addModalInstance.close({ restoreFocus: true });
        addModalInstance = null;
      }
    };

    const openAddModal = () => {
      closeAddModal();
      const { today, user, scheduleDraft, facultySchedule, saveFacultySlot, setFeedback } = getApp();
      const draft = scheduleDraft || facultySchedule;
      slotForm = {
        date: today,
        start: '14:00',
        end: '14:30',
        mode: 'in-person',
        location: draft.location || user?.office || '',
      };
      showAddModal = true;

      const $form = $('<form>').attr('novalidate', 'novalidate');
      const $err = $('<div>').addClass('form-error').attr('role', 'alert');

      const showSlotError = (msg) => {
        if (msg) {
          $err.text(msg);
          if (!$err.parent().length) $form.prepend($err);
        } else {
          $err.remove();
        }
      };

      let $endField;
      const handleSlotChange = (event) => {
        const { name, value } = event.target;
        slotForm[name] = value;
        if (name === 'start' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
          slotForm.end = addMinutes(value, 30);
          $endField?.$control.val(slotForm.end);
        }
        showSlotError('');
      };

      const $dateField = Field({
        name: 'date',
        label: 'Date',
        type: 'date',
        min: today,
        value: slotForm.date,
        required: true,
        onChange: handleSlotChange,
      });
      const $startField = Field({
        name: 'start',
        label: 'Start time',
        type: 'time',
        value: slotForm.start,
        required: true,
        onChange: handleSlotChange,
      });
      $endField = Field({
        name: 'end',
        label: 'End time',
        type: 'time',
        value: slotForm.end,
        required: true,
        onChange: handleSlotChange,
      });
      const $modeField = Field({
        name: 'mode',
        label: 'Consultation mode',
        as: 'select',
        value: slotForm.mode,
        children: [
          $('<option>').val('in-person').text('In person')[0],
          $('<option>').val('online').text('Online')[0],
        ],
        onChange: handleSlotChange,
      });
      const $locationField = Field({
        name: 'location',
        label: 'Location / meeting details',
        value: slotForm.location,
        required: true,
        onChange: handleSlotChange,
      });

      $form.append(
        $dateField,
        $('<div>').addClass('field-row').append($startField, $endField),
        $modeField,
        $locationField,
        $('<div>')
          .addClass('modal-actions')
          .append(
            $('<button>')
              .attr('type', 'button')
              .addClass('btn')
              .text('Cancel')
              .on('click', closeAddModal),
            $('<button>')
              .attr('type', 'submit')
              .addClass('btn primary')
              .text('+ Add consultation slot'),
          ),
      );

      $form.on('submit', (event) => {
        event.preventDefault();
        if (!slotForm.date || !slotForm.start || !slotForm.end || !slotForm.location.trim()) {
          showSlotError('Enter a date, start time, end time, and location.');
          return;
        }
        const result = saveFacultySlot(slotForm);
        if (!result.ok) {
          showSlotError(result.error);
          return;
        }
        closeAddModal();
        setFeedback(
          `Availability slot added for ${fmtShort(slotForm.date)} · ${slotForm.start} – ${slotForm.end}. Changes reset on reload.`,
        );
      });

      addModalInstance = openModal({
        title: 'Add availability slot',
        description: 'Add a one-off 30-minute consultation slot on a specific date.',
        onClose: closeAddModal,
        children: $form,
      });
    };

    const syncDirtyUI = () => {
      const { scheduleDraft } = getApp();
      const isDirty = !!scheduleDraft;
      $scheduleStateEl
        ?.toggleClass('dirty', isDirty)
        .text(isDirty ? 'Unsaved draft · retained during navigation' : 'Published schedule');
      $discardBtnEl?.prop('disabled', !isDirty);
      $draftStatusEl?.text(isDirty ? 'Unsaved changes' : 'No unsaved changes');
      if ($errorAlertEl && !error) {
        $errorAlertEl.remove();
        $errorAlertEl = null;
      }
    };

    const render = () => {
      const {
        today,
        facultySchedule,
        saveFacultySchedule,
        scheduleDraft,
        setScheduleDraft,
        setFeedback,
      } = getApp();

      const draft = scheduleDraft || facultySchedule;
      const isDirty = !!scheduleDraft;
      const publishWeeks = Number(draft.weeks) || 4;
      const lastDate = addDays(today, publishWeeks * 7 - 1);

      const changeDraft = (next, { reRender = true } = {}) => {
        error = '';
        if (reRender) {
          setScheduleDraft(next);
          render();
        } else {
          setScheduleDraft(next, { silent: true });
          syncDirtyUI();
        }
      };

      const updateDay = (dayIndex, fields, opts) => {
        const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
        changeDraft(
          {
            ...currentDraft,
            weekly: currentDraft.weekly.map((row, index) => (index === dayIndex ? { ...row, ...fields } : row)),
          },
          opts,
        );
      };

      const handleIntervalChange = (dayIndex, intervalIndex, event) => {
        const { name, value } = event.target;
        const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
        const intervals = intervalsOf(currentDraft.weekly[dayIndex]).map((interval, index) =>
          index === intervalIndex ? { ...interval, [name]: value } : interval,
        );
        updateDay(dayIndex, { intervals }, { reRender: false });
      };

      const handleApplyCopy = (sourceIndex, targetIndices) => {
        const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
        const source = currentDraft.weekly[sourceIndex];
        activeCopyDay = null;
        copyTargetDays = [];
        changeDraft({
          ...currentDraft,
          weekly: currentDraft.weekly.map((row, index) =>
            targetIndices.includes(index)
              ? {
                  ...row,
                  enabled: source.enabled,
                  intervals: structuredClone(intervalsOf(source)),
                }
              : row,
          ),
        });
      };

      const $addBtn = $('<button>')
        .attr('type', 'button')
        .addClass('btn primary')
        .text('+ Add availability')
        .on('click', openAddModal);

      $scheduleStateEl = $('<span>')
        .addClass(`schedule-state ${isDirty ? 'dirty' : ''}`.trim())
        .attr('role', 'status')
        .text(isDirty ? 'Unsaved draft · retained during navigation' : 'Published schedule');

      const $tabs = AvailabilityTabs({ children: [$addBtn[0], $scheduleStateEl[0]] });

      const $form = $('<form>');
      $errorAlertEl = null;
      if (error) {
        $errorAlertEl = $('<div>').addClass('form-error').attr('role', 'alert').text(error);
        $form.append($errorAlertEl);
      }

      const $recurringSection = $('<section>').addClass('card recurring-hours').append(
        $('<h2>').text('Weekly recurring hours'),
        $('<p>')
          .addClass('muted small schedule-help')
          .text(
            `Monday–Friday · 30-minute consultations · Campus local time · Publishing ${publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}`,
          ),
      );

      draft.weekly.forEach((row, dayIndex) => {
        const intervals = intervalsOf(row);
        const isCopyingThisDay = activeCopyDay === dayIndex;
        const $dayRow = $('<div>')
          .addClass('schedule-day')
          .attr({ role: 'group', 'aria-label': `${row.day} hours` });

        const $dayToggle = $('<button>')
          .addClass(`btn day-toggle ${row.enabled ? 'primary' : ''}`.trim())
          .attr({
            type: 'button',
            'aria-label': `${row.day} availability`,
            'aria-pressed': String(row.enabled),
          })
          .text(row.enabled ? '● On' : '○ Off')
          .on('click', () => updateDay(dayIndex, { enabled: !row.enabled }));

        const $intervalsCol = $('<div>').addClass('schedule-intervals');

        intervals.forEach((interval, intervalIndex) => {
          const $intervalRow = $('<div>').addClass('schedule-interval');
          for (const name of ['start', 'end']) {
            $intervalRow.append(
              Field({
                name,
                label: `${row.day} ${name} ${intervalIndex + 1}`,
                className: 'time-field',
                type: 'time',
                disabled: !row.enabled,
                required: row.enabled,
                value: interval[name],
                onChange: (event) => handleIntervalChange(dayIndex, intervalIndex, event),
              }),
            );
          }

          const $actions = $('<div>').addClass('interval-actions');
          if (intervalIndex === 0) {
            $actions.append(
              $('<button>')
                .attr({ type: 'button', 'aria-label': `Add ${row.day} interval` })
                .addClass('btn interval-add')
                .prop('disabled', !row.enabled)
                .text('+ Interval')
                .on('click', () =>
                  updateDay(dayIndex, { intervals: [...intervals, { start: '15:00', end: '16:00' }] }),
                ),
              $('<button>')
                .attr({
                  type: 'button',
                  'aria-label': `Copy ${row.day} hours to other days`,
                  'aria-expanded': String(isCopyingThisDay),
                  title: `Copy ${row.day} hours to other days`,
                })
                .addClass(`btn copy-btn ${isCopyingThisDay ? 'active' : ''}`.trim())
                .prop('disabled', !row.enabled)
                .text('Copy to...')
                .on('click', () => {
                  activeCopyDay = isCopyingThisDay ? null : dayIndex;
                  copyTargetDays = [];
                  render();
                }),
            );
          } else {
            $actions.append(
              $('<button>')
                .attr({
                  type: 'button',
                  'aria-label': `Remove ${row.day} interval ${intervalIndex + 1}`,
                })
                .addClass('btn interval-remove')
                .prop('disabled', !row.enabled || intervals.length === 1)
                .text('Remove')
                .on('click', () =>
                  updateDay(dayIndex, {
                    intervals: intervals.filter((_, index) => index !== intervalIndex),
                  }),
                ),
            );
          }
          $intervalRow.append($actions);
          $intervalsCol.append($intervalRow);
        });

        if (isCopyingThisDay) {
          const $drawer = $('<div>')
            .addClass('inline-copy-drawer')
            .attr({ role: 'region', 'aria-label': `Copy ${row.day} hours to other days` });
          $drawer.append($('<span>').addClass('copy-prompt').text(`Copy ${row.day} to:`));

          const $pills = $('<div>')
            .addClass('copy-target-pills')
            .attr({ role: 'group', 'aria-label': 'Destination days' });

          let $applyBtn;
          draft.weekly.forEach((targetRow, targetIndex) => {
            if (targetIndex === dayIndex) return;
            const $chk = $('<input>')
              .attr({ type: 'checkbox', 'aria-label': `Copy to ${targetRow.day}` })
              .prop('checked', copyTargetDays.includes(targetIndex))
              .on('change', () => {
                if (copyTargetDays.includes(targetIndex)) {
                  copyTargetDays = copyTargetDays.filter((d) => d !== targetIndex);
                } else {
                  copyTargetDays = [...copyTargetDays, targetIndex];
                }
                $applyBtn.prop('disabled', !copyTargetDays.length);
              });
            $pills.append(
              $('<label>').attr('title', targetRow.day).append($chk, document.createTextNode(targetRow.day.slice(0, 3))),
            );
          });

          $applyBtn = $('<button>')
            .attr('type', 'button')
            .addClass('btn small primary')
            .prop('disabled', !copyTargetDays.length)
            .text('Apply')
            .on('click', () => handleApplyCopy(dayIndex, copyTargetDays));

          const $allBtn = $('<button>')
            .attr('type', 'button')
            .addClass('btn small')
            .text('All weekdays')
            .on('click', () => {
              const allOtherIndices = draft.weekly.map((_, i) => i).filter((i) => i !== dayIndex);
              handleApplyCopy(dayIndex, allOtherIndices);
            });

          const $cancelCopyBtn = $('<button>')
            .attr('type', 'button')
            .addClass('btn small link-btn')
            .text('Cancel')
            .on('click', () => {
              activeCopyDay = null;
              copyTargetDays = [];
              render();
            });

          $drawer.append(
            $pills,
            $('<div>').addClass('copy-drawer-actions').append($applyBtn, $allBtn, $cancelCopyBtn),
          );
          $intervalsCol.append($drawer);
        }

        $dayRow.append(
          $('<span>').addClass('schedule-day-label').text(row.day),
          $dayToggle,
          $intervalsCol,
        );
        $recurringSection.append($dayRow);
      });

      const $locationField = Field({
        label: 'Location',
        value: draft.location,
        required: true,
        onChange: (event) => {
          const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
          changeDraft({ ...currentDraft, location: event.target.value }, { reRender: false });
        },
      });

      const weekOptions = [
        [1, '1 week'],
        [2, '2 weeks'],
        [3, '3 weeks'],
        [4, '4 weeks (1 month · default)'],
        [6, '6 weeks'],
        [8, '8 weeks (half term)'],
        [12, '12 weeks (full term / semester)'],
        [16, '16 weeks'],
      ].map(([val, label]) => $('<option>').val(String(val)).text(label)[0]);

      const $weeksField = Field({
        label: 'Publish schedule for',
        as: 'select',
        value: String(draft.weeks || 4),
        children: weekOptions,
        onChange: (event) => {
          const nextWeeks = Number(event.target.value);
          const nextLastDate = addDays(today, nextWeeks * 7 - 1);
          if (date > nextLastDate) date = nextLastDate;
          if (endDate > nextLastDate) endDate = nextLastDate;
          const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
          changeDraft({ ...currentDraft, weeks: nextWeeks });
        },
      });

      $recurringSection.append(
        $('<div>').addClass('field-row').append($locationField, $weeksField),
        $('<div>').addClass('schedule-protection muted small').append(
          $('<strong>').text('Occupied slots stay protected'),
          $('<p>').text(
            `Pending, confirmed, and historical appointment slots stay unchanged, including within blocked date ranges. Exceptions remove only unreferenced times in the next ${publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}.`,
          ),
        ),
      );

      const $overridesSection = $('<section>').addClass('card');
      let $endDateField;
      const $startDateField = Field({
        label: 'Exception start date',
        type: 'date',
        min: today,
        max: lastDate,
        value: date,
        onChange: (event) => {
          date = event.target.value;
          if (endDate < date) {
            endDate = date;
            $endDateField?.$control.val(endDate);
          }
        },
      });
      $endDateField = Field({
        label: 'Exception end date',
        type: 'date',
        min: date,
        max: lastDate,
        value: endDate,
        onChange: (event) => {
          endDate = event.target.value;
        },
      });

      const $exceptionList = $('<ul>').addClass('exception-list');
      draft.exceptions.forEach((exception, index) => {
        const label =
          typeof exception === 'string'
            ? fmtShort(exception)
            : `${fmtShort(exception.start)} – ${fmtShort(exception.end)}`;
        $exceptionList.append(
          $('<li>').append(
            $('<span>').text(`${label} · Unavailable`),
            $('<button>')
              .attr({ type: 'button', 'aria-label': `Remove exception ${index + 1}` })
              .addClass('link-btn')
              .text('Remove')
              .on('click', () => {
                const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
                changeDraft({
                  ...currentDraft,
                  exceptions: currentDraft.exceptions.filter((_, otherIndex) => otherIndex !== index),
                });
              }),
          ),
        );
      });

      $overridesSection.append(
        $('<h2>').text('Date-specific overrides'),
        $('<p>').addClass('muted faculty-spaced').text('Block exam weeks, holidays, or one day.'),
        $startDateField,
        $endDateField,
        $('<button>')
          .addClass('btn block')
          .attr('type', 'button')
          .text('Add exception')
          .on('click', () => {
            if (!date || !endDate || date < today || endDate < date || endDate > lastDate) {
              error = `Choose an exception range within the next ${publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}.`;
              render();
              return;
            }
            const currentDraft = getApp().scheduleDraft || getApp().facultySchedule;
            changeDraft({
              ...currentDraft,
              exceptions: [...currentDraft.exceptions, { start: date, end: endDate }],
            });
          }),
        $exceptionList,
        $('<p>')
          .addClass('muted small')
          .text(
            `${draft.exceptions.length ? `${draft.exceptions.length} date exception(s).` : 'No exceptions added yet.'} Save changes publishes the next ${publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}.`,
          ),
      );

      $discardBtnEl = $('<button>')
        .addClass('btn')
        .attr('type', 'button')
        .prop('disabled', !isDirty)
        .text('Discard draft')
        .on('click', () => {
          setScheduleDraft(null);
          error = '';
          activeCopyDay = null;
          copyTargetDays = [];
          setFeedback('Draft discarded. Published schedule retained.');
          render();
        });

      $draftStatusEl = $('<span>')
        .attr('role', 'status')
        .text(isDirty ? 'Unsaved changes' : 'No unsaved changes');

      $form.append(
        $('<div>').addClass('faculty-manager').append($recurringSection, $overridesSection),
        $('<div>')
          .addClass('draft-controls')
          .append(
            $('<button>').addClass('btn primary').attr('type', 'submit').text('Save changes'),
            $discardBtnEl,
            $draftStatusEl,
          ),
      );

      $form.on('submit', (event) => {
        event.preventDefault();
        const latestDraft = getApp().scheduleDraft || getApp().facultySchedule;
        const weeks = Number(latestDraft.weeks) || 4;
        const result = saveFacultySchedule(latestDraft);
        if (!result.ok) {
          error = result.error;
          render();
          return;
        }
        error = '';
        setFeedback(
          `Availability published for the next ${weeks === 1 ? '1 week' : `${weeks} weeks`}. Changes reset on reload.`,
        );
        render();
      });

      $root.empty().append(
        PageHead({
          title: 'Availability manager',
          subtitle: 'Set weekly consultation hours, manage date exceptions, and add one-off availability.',
        }),
        $tabs,
        $form,
      );
    };

    render();
    if (showAddModal) {
      openAddModal();
    }

    return {
      $el: $root,
      update() {
        const loc = getLocation();
        const wantsAdd =
          loc.searchParams.has('add') ||
          loc.hash === '#add-slot' ||
          window.location.search.includes('add=') ||
          window.location.hash.endsWith('#add-slot');
        render();
        if (wantsAdd && !addModalInstance) {
          openAddModal();
        }
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('draft') || reasons.has('clock')) {
          render();
        }
      },
      destroy() {
        closeAddModal();
      },
    };
  }

  FC.createAvailabilityPage = createAvailabilityPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
