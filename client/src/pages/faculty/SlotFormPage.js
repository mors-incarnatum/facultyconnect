(function (FC, $) {
  'use strict';

  const { Field, MissingRecord, PageHead, createLink, navigate, getApp } = FC;

  function createSlotFormPage({ params = {} } = {}) {
    let id = params.id;
    let form = null;
    const $root = $('<div>');

    const initForm = () => {
      const { today, user, getSlot } = getApp();
      const slot = id ? getSlot(id) : null;
      form = slot
        ? { ...slot }
        : {
            date: today,
            start: '14:00',
            end: '14:30',
            mode: 'in-person',
            location: user.office,
          };
    };

    const render = () => {
      const { today, user, getSlot, holderOf, saveFacultySlot, setFeedback } = getApp();
      const slot = id ? getSlot(id) : null;
      if (!form) initForm();

      $root.empty();

      if (id && (!slot || slot.facultyId !== user.id)) {
        $root.append(MissingRecord({ availability: true }));
        return;
      }

      const occupied = id && holderOf(id);

      $root.append(
        PageHead({
          title: id ? 'Edit availability' : 'Create consultation availability',
          subtitle: 'Set the date and time students can request.',
        }),
        $('<div>').addClass('toolbar').append(createLink('/faculty/availability/slots', '← Back to my availability')),
      );

      const $form = $('<form>').addClass('card').attr('novalidate', 'novalidate');
      $form.append($('<h2>').addClass('section-title').text('Consultation schedule'));

      if (occupied) {
        $form.append(
          $('<div>')
            .addClass('notice warn')
            .append(
              document.createTextNode('This slot is reserved. '),
              createLink(`/faculty/consultations/${occupied.id}`, 'View appointment'),
            ),
        );
      } else {
        const $errorBox = $('<div>').addClass('form-error').attr('role', 'alert');
        const fields = {};

        const setTopError = (msg) => {
          if (msg) {
            $errorBox.text(msg);
            if (!$errorBox.parent().length) {
              $form.find('.section-title').after($errorBox);
            }
          } else {
            $errorBox.remove();
          }
        };

        const handleChange = (event) => {
          const { name, value } = event.target;
          form[name] = value;
          fields[name]?.setError('');
          setTopError('');
        };

        fields.date = Field({
          name: 'date',
          label: 'Date',
          type: 'date',
          min: today,
          required: true,
          value: form.date,
          onChange: handleChange,
        });
        fields.start = Field({
          name: 'start',
          label: 'Start time',
          type: 'time',
          required: true,
          value: form.start,
          onChange: handleChange,
        });
        fields.end = Field({
          name: 'end',
          label: 'End time',
          type: 'time',
          required: true,
          value: form.end,
          onChange: handleChange,
        });
        fields.mode = Field({
          name: 'mode',
          label: 'Consultation mode',
          as: 'select',
          value: form.mode,
          children: [
            $('<option>').val('in-person').text('In person')[0],
            $('<option>').val('online').text('Online')[0],
          ],
          onChange: handleChange,
        });
        fields.location = Field({
          name: 'location',
          label: 'Location / meeting details',
          required: true,
          value: form.location,
          onChange: handleChange,
        });

        $form.append(
          fields.date,
          $('<div>').addClass('field-row').append(fields.start, fields.end),
          fields.mode,
          fields.location,
          $('<p>').addClass('muted small').text('One appointment per slot · 30-minute consultations.'),
          $('<div>')
            .addClass('btn-row')
            .append(
              $('<button>')
                .addClass('btn primary')
                .attr('type', 'submit')
                .text(id ? 'Save changes' : 'Publish availability'),
              createLink('/faculty/availability/slots', 'Cancel', { className: 'btn' }),
            ),
        );

        const focusInvalidField = () => {
          requestAnimationFrame(() => $form[0]?.querySelector('[aria-invalid="true"]')?.focus());
        };

        $form.on('submit', (event) => {
          event.preventDefault();
          let valid = true;
          for (const name of ['date', 'start', 'end', 'location']) {
            if (!form[name]?.trim()) {
              const label =
                name === 'location' ? 'a location or meeting details' : `a valid ${name} date/time`;
              fields[name]?.setError(`Enter ${label}.`);
              valid = false;
            } else {
              fields[name]?.setError('');
            }
          }
          if (!valid) {
            focusInvalidField();
            return;
          }
          const result = saveFacultySlot(form, id);
          if (!result.ok) {
            const errField = /date/i.test(result.error)
              ? 'date'
              : /location/i.test(result.error)
                ? 'location'
                : 'end';
            fields[errField]?.setError(result.error);
            setTopError(result.error);
            focusInvalidField();
            return;
          }
          const feedback = 'Availability published in this demo. Changes reset on reload.';
          setFeedback(feedback);
          navigate('/faculty/availability/slots', { state: { feedback } });
        });
      }

      const $aside = $('<aside>').addClass('card tint').append(
        $('<h2>').text('Keep availability current'),
        $('<p>')
          .addClass('faculty-spaced')
          .text(
            'Students see published dates and time slots when they browse your profile. Changes are reflected in their availability view.',
          ),
        $('<p>')
          .addClass('muted small')
          .text('Review any existing appointment before changing an occupied slot.'),
      );

      $root.append($('<div>').addClass('two-col').append($form, $aside));
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        const nextId = nextCtx?.params?.id;
        if (nextId !== id) {
          id = nextId;
          form = null;
        }
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data')) render();
      },
    };
  }

  FC.createSlotFormPage = createSlotFormPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
