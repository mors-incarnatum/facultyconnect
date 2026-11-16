(function (FC, $) {
  'use strict';

  const {
    Avatar,
    BookingStepper,
    Field,
    PageHead,
    createLink,
    getLocation,
    navigate,
    REQUEST_CLOSED_MESSAGE,
    isRequestOpen,
    getApp,
    isFutureSlot,
    fmtLong,
    fmtRange,
    modeLabel,
  } = FC;

  function createRequestPage() {
    const initLoc = getLocation();
    let lastSlotParam = initLoc.searchParams.get('slot');
    let form = initLoc.state?.draft
      ? { ...initLoc.state.draft }
      : { subject: '', topic: '', description: '' };
    let $alertWrap = null;
    let $submitBtn = null;
    let $changeTimeLink = null;
    let $backLink = null;

    const $root = $('<div>');

    const syncAvailabilityBanner = () => {
      const loc = getLocation();
      const { now, getSlot, isAvailable } = getApp();
      const slot = getSlot(loc.searchParams.get('slot'));
      if (!slot || !$alertWrap || !$submitBtn) return;

      const closed = isFutureSlot(slot, now) && !isRequestOpen(slot, now);
      const taken = !isAvailable(slot);
      const changeTime = `/student/faculty/calendar?faculty=${slot.facultyId}&slot=${slot.id}`;
      const draftState = { ...loc.state, draft: form };

      $alertWrap.empty();
      if (closed) {
        $alertWrap.append(
          $('<div>')
            .addClass('form-error')
            .attr('role', 'alert')
            .append(
              document.createTextNode(`${REQUEST_CLOSED_MESSAGE} `),
              createLink(changeTime, 'Choose another time', { state: draftState }),
              document.createTextNode('; your topic will be kept.'),
            ),
        );
      } else if (taken) {
        $alertWrap.append(
          $('<div>')
            .addClass('form-error')
            .attr('role', 'alert')
            .append(
              document.createTextNode('This time is no longer available. '),
              createLink(changeTime, 'Choose another time', { state: draftState }),
              document.createTextNode('; your topic will be kept.'),
            ),
        );
      }

      $submitBtn.prop('disabled', taken);
    };

    const render = () => {
      const loc = getLocation();
      const { user, getSlot, getFaculty, createAppointment } = getApp();
      const slotId = loc.searchParams.get('slot');
      if (slotId !== lastSlotParam) {
        lastSlotParam = slotId;
        form = loc.state?.draft
          ? { ...loc.state.draft }
          : { subject: '', topic: '', description: '' };
      }

      const slot = getSlot(slotId);
      const f = slot && getFaculty(slot.facultyId);

      $root.empty();
      $alertWrap = null;
      $submitBtn = null;

      if (!slot) {
        $root.append(
          PageHead({ title: 'Request a consultation', subtitle: 'Choose a time first.' }),
          createLink('/student/faculty', 'Find faculty →', { className: 'btn primary' }),
        );
        return;
      }

      const changeTime = `/student/faculty/calendar?faculty=${slot.facultyId}&slot=${slot.id}`;
      const backTo = loc.state?.returnTo || `/student/faculty/${slot.facultyId}`;
      const getDraftState = () => ({ ...getLocation().state, draft: { ...form } });

      $alertWrap = $('<div>');

      const $subjectField = Field({
        name: 'subject',
        required: true,
        label: 'Subject / course',
        value: form.subject,
        list: 'courses',
        placeholder: 'CCDSALG · Data Structures and Algorithms',
        onChange: (event) => {
          form.subject = event.target.value;
          $subjectField.setError('');
        },
      });

      const $datalist = $('<datalist>').attr('id', 'courses');
      for (const c of f.courses) {
        $datalist.append($('<option>').val(c));
      }

      const $topicField = Field({
        name: 'topic',
        required: true,
        label: 'Consultation topic',
        value: form.topic,
        placeholder: 'Help understanding recursion',
        onChange: (event) => {
          form.topic = event.target.value;
          $topicField.setError('');
        },
      });

      const $descField = Field({
        name: 'description',
        label: 'Preparation notes (optional)',
        as: 'textarea',
        value: form.description,
        placeholder: 'Share what you have tried and what you would like to cover.',
        onChange: (event) => {
          form.description = event.target.value;
        },
      });

      $submitBtn = $('<button>')
        .addClass('btn primary')
        .attr('type', 'submit')
        .text('Submit request →');

      $backLink = createLink(backTo, 'Back to Availability', { className: 'btn' });
      $backLink.off('click').on('click', (event) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        navigate(backTo, { state: getDraftState() });
      });

      const $form = $('<form>').addClass('card request-form').attr('novalidate', 'novalidate');
      $form.append(
        $('<h2>').text('What would you like to discuss?'),
        $alertWrap,
        $subjectField,
        $datalist,
        $topicField,
        $descField,
        $('<p>')
          .addClass('muted small')
          .text(
            'Submitting reserves this slot. Your meeting is confirmed after the faculty approves your request, which must happen at least 24 hours before the consultation, or the request is automatically declined.',
          ),
        $('<div>').addClass('btn-row').append($submitBtn, $backLink),
      );

      $form.on('submit', (event) => {
        event.preventDefault();
        const subjectErr = !form.subject.trim()
          ? 'Enter the subject or course for this consultation.'
          : '';
        const topicErr = !form.topic.trim()
          ? 'Enter a topic so your faculty member can prepare.'
          : '';
        $subjectField.setError(subjectErr);
        $topicField.setError(topicErr);
        if (subjectErr || topicErr) {
          requestAnimationFrame(() => $form[0]?.querySelector('[aria-invalid="true"]')?.focus());
          return;
        }

        const { now: currentNow } = getApp();
        const closedNow = isFutureSlot(slot, currentNow) && !isRequestOpen(slot, currentNow);
        if (closedNow) {
          syncAvailabilityBanner();
          return;
        }

        const res = createAppointment({
          studentId: user.id,
          slotId: slot.id,
          subject: form.subject.trim(),
          topic: form.topic.trim(),
          description: form.description.trim(),
        });
        if (res.reason === 'closed') {
          syncAvailabilityBanner();
          return;
        }
        if (!res.ok) {
          navigate(`/student/booking-conflict?slot=${slot.id}`, { state: getDraftState() });
          return;
        }
        navigate(`/student/request/submitted/${res.id}`);
      });

      $changeTimeLink = createLink(changeTime, 'Change time', { className: 'btn block' });
      $changeTimeLink.off('click').on('click', (event) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        navigate(changeTime, { state: getDraftState() });
      });

      const $aside = $('<aside>').addClass('card preview request-preview').append(
        $('<div>').addClass('eyebrow').text('Your selected time'),
        $('<div>').css('margin', '14px 0').append(Avatar({ person: f, size: 'lg' })),
        $('<h3>').css({ fontSize: '24px', margin: '0 0 4px' }).text(f.name),
      );
      if (f.pronouns) {
        $aside.append($('<p>').addClass('muted small').text(f.pronouns));
      }
      $aside.append($('<p>').addClass('muted').css('margin', '2px 0 10px').text(`${f.rank} · ${f.department}`));
      if (f.consultationTip) {
        $aside.append(
          $('<div>')
            .addClass('profile-tip')
            .css({ margin: '10px 0', fontSize: '12px', padding: '8px 10px' })
            .append($('<div>').append($('<strong>').text('Prep tip: '), document.createTextNode(f.consultationTip))),
        );
      }
      $aside.append(
        $('<hr>').addClass('divider'),
        $('<div>').addClass('when-big').css('margin-top', 0).text(fmtLong(slot.date)),
        $('<div>').addClass('time-big').text(fmtRange(slot.start, slot.end)),
        $('<p>')
          .addClass('muted')
          .css('margin-bottom', '16px')
          .append(
            document.createTextNode(`${modeLabel(slot)} · 30 minutes`),
            document.createElement('br'),
            document.createTextNode(slot.location),
          ),
        $changeTimeLink,
      );

      $root.append(
        PageHead({
          title: 'Request a consultation',
          subtitle: 'Review your selected time and specify your consultation topic.',
        }),
        BookingStepper(),
        $('<div>').addClass('two-col request-workspace').append($form, $aside),
      );

      syncAvailabilityBanner();
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('clock') || reasons.has('data')) {
          syncAvailabilityBanner();
        }
      },
    };
  }

  FC.createRequestPage = createRequestPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
