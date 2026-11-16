(function (FC, $) {
  'use strict';

  const {
    AppointmentNotFound,
    Field,
    PageHead,
    createLink,
    getLocation,
    navigate,
    canManageAppointment,
    getApp,
    getOwnedAppointment,
    fmtLong,
    fmtRange,
  } = FC;

  function createEditTopicPage({ params }) {
    let currentParams = params;
    let form = null;
    let renderedEditable = null;
    const $root = $('<div>');

    const render = () => {
      const loc = getLocation();
      const { now, updateTopic } = getApp();
      const a = getOwnedAppointment(currentParams.id);

      $root.empty();
      if (!a) {
        renderedEditable = null;
        $root.append(AppointmentNotFound());
        return;
      }

      if (!form) {
        form = { subject: a.subject, topic: a.topic || '', description: a.description || '' };
      }

      const editable = canManageAppointment(a, a.slot, now);
      renderedEditable = editable;

      $root.append(
        PageHead({
          title: 'Edit consultation topic',
          subtitle: 'Update what you would like to discuss before the consultation.',
        }),
      );

      if (!editable) {
        $root.append(
          $('<div>')
            .addClass('card')
            .append(
              $('<div>')
                .addClass('notice warn')
                .text('Topics can only be changed before a pending or confirmed consultation starts.'),
              $('<div>')
                .addClass('btn-row')
                .append(createLink(`/student/appointments?id=${a.id}`, 'Back', { className: 'btn' })),
            ),
        );
        return;
      }

      const $form = $('<form>').addClass('card').attr('novalidate', 'novalidate');
      const $errorBox = $('<div>').addClass('form-error').attr('role', 'alert');

      const showError = (msg) => {
        if (msg) {
          $errorBox.text(msg);
          if (!$errorBox.parent().length) {
            $form.find('h2').after($errorBox);
          }
        } else {
          $errorBox.remove();
        }
      };

      const handleChange = (event) => {
        const { name, value } = event.target;
        form[name] = value;
      };

      const $btnRow = $('<div>')
        .addClass('btn-row')
        .css('margin-top', 0)
        .append(
          $('<button>').addClass('btn primary').attr('type', 'submit').text('Save topic changes'),
          createLink(`/student/appointments?id=${a.id}`, 'Cancel', { className: 'btn' }),
        );

      if (a.topic) {
        $btnRow.append(
          createLink(`/student/appointments/${a.id}/delete-topic`, 'Delete topic', {
            className: 'btn',
            css: { border: 0 },
          }),
        );
      }

      $form.append(
        $('<h2>')
          .css({ fontSize: '26px', marginBottom: '16px' })
          .text(`${a.faculty.name} · ${fmtLong(a.slot.date)} · ${fmtRange(a.slot.start, a.slot.end)}`),
        Field({
          name: 'subject',
          label: 'Subject / course',
          value: form.subject,
          onChange: handleChange,
        }),
        Field({
          name: 'topic',
          label: 'Consultation topic',
          value: form.topic,
          onChange: handleChange,
        }),
        Field({
          name: 'description',
          label: 'Description',
          as: 'textarea',
          value: form.description,
          onChange: handleChange,
        }),
        $btnRow,
      );

      $form.on('submit', (event) => {
        event.preventDefault();
        if (!form.subject.trim() || !form.topic.trim()) {
          showError('Subject and topic are required.');
          return;
        }
        const result = updateTopic(a.id, {
          subject: form.subject.trim(),
          topic: form.topic.trim(),
          description: form.description.trim(),
        });
        if (!result.ok) {
          showError(result.error);
          return;
        }
        navigate(loc.state?.returnTo || `/student/appointments?id=${a.id}`, {
          state: {
            returnScroll: loc.state?.returnScroll,
            feedback: 'Consultation topic updated for this demo. Changes reset on reload.',
          },
        });
      });

      $root.append($form);
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        const nextId = nextCtx?.params?.id;
        if (nextId !== currentParams.id) {
          currentParams = nextCtx.params;
          form = null;
        }
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data')) {
          render();
          return;
        }
        if (reasons.has('clock')) {
          const a = getOwnedAppointment(currentParams.id);
          const nowEditable = a ? canManageAppointment(a, a.slot, getApp().now) : null;
          if (nowEditable !== renderedEditable) {
            render();
          }
        }
      },
    };
  }

  FC.createEditTopicPage = createEditTopicPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
