(function (FC, $) {
  'use strict';

  const {
    AppointmentNotFound,
    PageHead,
    createLink,
    navigate,
    canManageAppointment,
    getApp,
    getOwnedAppointment,
    topicLine,
  } = FC;

  function createDeleteTopicPage({ params }) {
    let currentParams = params;
    let error = '';
    const $root = $('<div>');

    const render = () => {
      const { now, deleteTopic } = getApp();
      const a = getOwnedAppointment(currentParams.id);
      $root.empty();

      if (!a) {
        $root.append(AppointmentNotFound());
        return;
      }

      const $card = $('<div>').addClass('card');
      const $errorBox = $('<p>').addClass('form-error').attr('role', 'alert');

      const showError = (msg) => {
        error = msg;
        if (msg) {
          $errorBox.text(msg);
          if (!$errorBox.parent().length) $card.prepend($errorBox);
        } else {
          $errorBox.remove();
        }
      };

      if (error) {
        $errorBox.text(error);
        $card.append($errorBox);
      }

      if (a.topic && canManageAppointment(a, a.slot, now)) {
        $card.append(
          $('<h2>').css({ fontSize: '26px', marginBottom: '10px' }).text(topicLine(a)),
          $('<p>').addClass('muted').css('margin-bottom', '14px').text(a.description || ''),
          $('<p>').text('Deleting removes the consultation topic and description. It does not cancel your appointment.'),
          $('<div>')
            .addClass('btn-row')
            .append(
              $('<button>')
                .addClass('btn primary')
                .text('Delete topic')
                .on('click', () => {
                  const result = deleteTopic(a.id);
                  if (!result.ok) {
                    showError(result.error);
                    return;
                  }
                  navigate(`/student/appointments?id=${a.id}`, {
                    state: { feedback: 'Topic deleted. Your appointment remains scheduled in this demo.' },
                  });
                }),
              createLink(`/student/appointments?id=${a.id}`, 'Keep topic', { className: 'btn' }),
            ),
        );
      } else {
        $card.append(
          $('<p>').text(
            a.topic
              ? 'Topics can only be deleted before a pending or confirmed consultation starts.'
              : 'This appointment has no topic to delete.',
          ),
          $('<div>')
            .addClass('btn-row')
            .append(createLink(`/student/appointments?id=${a.id}`, 'Back', { className: 'btn' })),
        );
      }

      $root.append(
        PageHead({
          title: 'Delete this consultation topic?',
          subtitle: 'Your appointment will remain scheduled.',
        }),
        $card,
      );
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        error = '';
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock')) render();
      },
    };
  }

  FC.createDeleteTopicPage = createDeleteTopicPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
