(function (FC, $) {
  'use strict';

  const { AppointmentOutcome } = FC;

  function createAppointmentCancelledPage({ params }) {
    let currentParams = params;
    const $root = $('<div>');
    const render = () => $root.empty().append(AppointmentOutcome({ outcome: 'cancelled', params: currentParams }));
    render();
    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        render();
      },
    };
  }

  FC.createAppointmentCancelledPage = createAppointmentCancelledPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
