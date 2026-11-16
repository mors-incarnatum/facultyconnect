(function (FC, $) {
  'use strict';

  const {
    AppointmentSummary,
    MissingRecord,
    PageHead,
    createLink,
    getOwnedAppointment,
  } = FC;

  const TITLES = {
    confirmed: 'Request accepted',
    declined: 'Request declined',
    completed: 'Consultation completed',
    cancelled: 'Consultation cancelled',
    pending: 'Consultation request',
  };

  function createConsultationUpdatedPage({ params }) {
    let currentParams = params;
    const $root = $('<div>');

    const render = () => {
      const a = getOwnedAppointment(currentParams.id);
      $root.empty();

      if (!a) {
        $root.append(MissingRecord());
        return;
      }

      $root.append(
        PageHead({
          title: TITLES[a.status],
          subtitle: 'The appointment status is recorded for the student and faculty.',
        }),
        AppointmentSummary({
          appointment: a,
          children: $([
            $('<div>')
              .addClass('notice')
              .text(`This consultation is marked ${a.status} in the appointment record.`)[0],
            $('<div>')
              .addClass('btn-row')
              .append(
                createLink('/faculty/consultations', 'View consultations', { className: 'btn primary' }),
                createLink('/faculty', 'Faculty overview', { className: 'btn' }),
              )[0],
          ]),
        }),
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
        if (reasons.has('data') || reasons.has('clock')) render();
      },
    };
  }

  FC.createConsultationUpdatedPage = createConsultationUpdatedPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
