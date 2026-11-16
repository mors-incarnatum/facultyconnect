(function (FC, $) {
  'use strict';

  const { canManageAppointment, getApp, Field, openModal } = FC;

  function openAppointmentDialog({ appointment, mode, onClose, onSaved }) {
    const { now, updateTopic, setStatus, setFeedback } = getApp();
    const form = {
      subject: appointment.subject,
      topic: appointment.topic || '',
      description: appointment.description || '',
    };
    const editing = mode === 'edit';
    const editable = canManageAppointment(appointment, appointment.slot, now);

    const $form = $('<form>').attr('novalidate', 'novalidate');
    const $error = $('<p>').addClass('form-error').attr('role', 'alert');

    const showError = (message) => {
      if (message) {
        $error.text(message);
        if (!$error.parent().length) {
          $form.prepend($error);
        }
      } else {
        $error.remove();
      }
    };

    if (!editable) {
      $form.append(
        $('<p>')
          .addClass('notice warn')
          .text('Changes are available only before a pending or confirmed consultation starts.'),
      );
    }

    if (editing) {
      const $topicField = Field({
        name: 'topic',
        label: 'Topic / Discussion Goal',
        value: form.topic,
        autoFocus: true,
        disabled: !editable,
        onChange: (event) => {
          form.topic = event.target.value;
          showError('');
        },
      });
      const $details = $('<details>').addClass('additional-notes');
      $details.append($('<summary>').text('Course and preparation notes'));
      const $subjectField = Field({
        name: 'subject',
        label: 'Subject / course',
        value: form.subject,
        disabled: !editable,
        onChange: (event) => {
          form.subject = event.target.value;
          showError('');
        },
      });
      const $descField = Field({
        name: 'description',
        label: 'Preparation notes',
        as: 'textarea',
        value: form.description,
        disabled: !editable,
        onChange: (event) => {
          form.description = event.target.value;
          showError('');
        },
      });
      $details.append($subjectField, $descField);
      $form.append($topicField, $details);
    }

    const $cancelBtn = $('<button>')
      .attr('type', 'button')
      .addClass('btn')
      .text(editing ? 'Cancel' : 'Keep Appointment')
      .on('click', () => onClose());

    if (!editing) {
      $cancelBtn.attr('autofocus', 'autofocus');
    }

    const $submitBtn = $('<button>')
      .attr('type', 'submit')
      .addClass(`btn ${editing ? 'primary' : 'danger'}`)
      .prop('disabled', !editable)
      .text(editing ? 'Save Changes' : 'Yes, Cancel Consultation');

    $form.append($('<div>').addClass('modal-actions').append($cancelBtn, $submitBtn));

    let modal;

    $form.on('submit', (event) => {
      event.preventDefault();
      if (!editable) {
        showError('This appointment can no longer be changed.');
        return;
      }
      if (editing && (!form.subject.trim() || !form.topic.trim())) {
        showError('Subject and topic are required.');
        return;
      }
      const result = editing
        ? updateTopic(appointment.id, {
            subject: form.subject.trim(),
            topic: form.topic.trim(),
            description: form.description.trim(),
          })
        : setStatus(appointment.id, 'cancelled');

      if (!result.ok) {
        showError(result.error);
        return;
      }
      modal.close({ restoreFocus: false });
      setFeedback(
        editing
          ? 'Topic updated in-place.'
          : 'Consultation cancelled. The time is available for other students.',
      );
      onSaved(mode);
    });

    modal = openModal({
      title: editing ? 'Edit Consultation Topic' : 'Cancel Consultation?',
      description: editing
        ? `Update notes for your upcoming session with ${appointment.faculty.name}.`
        : 'Are you sure? This frees up the slot for other students. You can request another time afterwards.',
      className: editing ? 'topic-dialog' : 'cancel-dialog',
      onClose,
      children: $form,
    });

    return modal;
  }

  FC.openAppointmentDialog = openAppointmentDialog;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
