(function (FC, $) {
  'use strict';

  const {
    AppointmentSummary,
    MissingRecord,
    PageHead,
    StatusActions,
    createLink,
    getLocation,
    ACTIVE,
    getOwnedAppointment,
  } = FC;

  function createConsultationDetailsPage({ params }) {
    let currentParams = params;
    const $root = $('<div>');

    const render = () => {
      const loc = getLocation();
      const appointment = getOwnedAppointment(currentParams.id);
      $root.empty();

      if (!appointment) {
        $root.append(MissingRecord());
        return;
      }

      const isActive = ACTIVE.includes(appointment.status);
      const showActions = isActive || appointment.autoDeclined;

      const $aside = $('<aside>').addClass('card').append(
        $('<h2>').text('Update status'),
        $('<p>')
          .addClass('muted faculty-spaced')
          .text(
            isActive
              ? 'Choose the status that reflects this consultation.'
              : appointment.autoDeclined
                ? 'The record is retained in your history.'
                : `This consultation is ${appointment.status}. The record is retained in your history.`,
          ),
      );

      if (showActions) {
        $aside.append(StatusActions({ appointment }));
      }

      $aside.append(
        $('<div>')
          .addClass('btn-row')
          .append(
            createLink(loc.state?.returnTo || '/faculty/consultations', 'Back to consultations', {
              className: 'btn block',
              state: { returnScroll: loc.state?.returnScroll },
            }),
          ),
      );

      $root.append(
        PageHead({
          title: appointment.status === 'pending' ? 'Consultation request' : 'Consultation details',
          subtitle: 'Review the student’s topic and update the appointment status.',
        }),
        $('<div>').addClass('two-col consultation-detail-grid').append(
          AppointmentSummary({ appointment }),
          $aside,
        ),
      );
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock')) {
          render();
        }
      },
    };
  }

  FC.createConsultationDetailsPage = createConsultationDetailsPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
