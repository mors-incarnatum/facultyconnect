(function (FC, $) {
  'use strict';

  const { AUTO_DECLINED_FACULTY_MESSAGE, formatDeadline, facultyTransitions, getApp } = FC;

  const STATUS_LABELS = {
    confirmed: 'Accept request',
    declined: 'Decline request',
    completed: 'Mark completed',
    cancelled: 'Cancel consultation',
  };

  function StatusActions({ appointment, compact = false }) {
    let confirming = null;
    let error = '';

    const $root = $('<div>').addClass(compact ? 'btn-row' : 'stack');

    const render = () => {
      const { now, updateFacultyStatus, getSlot, setFeedback } = getApp();
      const slot = getSlot(appointment.slotId);
      const statuses = facultyTransitions(appointment, slot, now);

      $root.empty();

      if (appointment.autoDeclined) {
        $root.attr('class', 'stack');
        $root.append(
          $('<p>').addClass('notice warn').attr('role', 'status').text(AUTO_DECLINED_FACULTY_MESSAGE),
          $('<div>')
            .addClass(compact ? 'btn-row' : 'stack')
            .append(
              $('<button>').attr('type', 'button').addClass('btn primary').prop('disabled', true).text(STATUS_LABELS.confirmed),
              $('<button>').attr('type', 'button').addClass('btn').prop('disabled', true).text(STATUS_LABELS.declined),
            ),
        );
        return;
      }

      $root.attr('class', compact ? 'btn-row' : 'stack');

      const handleApply = (status) => {
        const result = updateFacultyStatus(appointment.id, status);
        confirming = null;
        if (!result.ok) {
          error = result.error;
          render();
          return;
        }
        error = '';
        setFeedback(`Consultation is now ${status}. Demo changes reset on reload.`);
      };

      const handleStatusChange = (status) => {
        if (['declined', 'cancelled'].includes(status)) {
          confirming = status;
          render();
          $root.find('[autofocus]').trigger('focus');
          return;
        }
        handleApply(status);
      };

      if (error) {
        $root.append($('<p>').addClass('form-error').attr('role', 'alert').text(error));
      }

      if (confirming) {
        const $confirm = $('<div>')
          .addClass('notice warn status-confirmation')
          .attr({ role: 'group', 'aria-label': 'Confirm status change' });
        $confirm.append(
          $('<p>').text(`${STATUS_LABELS[confirming]}? The student's reserved time will be released.`),
          $('<div>')
            .addClass('btn-row')
            .append(
              $('<button>')
                .attr({ type: 'button', autofocus: 'autofocus' })
                .addClass('btn')
                .text('Keep request')
                .on('click', () => {
                  confirming = null;
                  render();
                }),
              $('<button>')
                .attr('type', 'button')
                .addClass('btn danger')
                .text(`Confirm ${confirming === 'declined' ? 'decline' : 'cancellation'}`)
                .on('click', () => handleApply(confirming)),
            ),
        );
        $root.append($confirm);
      } else {
        for (const status of statuses) {
          $root.append(
            $('<button>')
              .attr('type', 'button')
              .addClass(`btn ${status === 'confirmed' ? 'primary' : ''}`.trim())
              .text(STATUS_LABELS[status])
              .on('click', () => handleStatusChange(status)),
          );
        }
      }

      if (!compact && appointment.status === 'pending' && statuses.length > 0) {
        $root.append(
          $('<p>')
            .addClass('muted small')
            .text(`Accept or decline by ${formatDeadline(slot)}. After that the request is automatically declined.`),
        );
      }
      if (!compact && appointment.status === 'confirmed' && !statuses.includes('completed')) {
        $root.append(
          $('<p>')
            .addClass('muted small')
            .text('Completion becomes available when the consultation ends.'),
        );
      }
    };

    render();
    return $root;
  }

  FC.StatusActions = StatusActions;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
