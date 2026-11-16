(function (FC, $) {
  'use strict';

  const { createLink, PageHead } = FC;

  function AppointmentNotFound() {
    return $([
      PageHead({ title: 'Appointment not found', subtitle: 'It may have been removed.' })[0],
      createLink('/student/appointments', 'Back to my appointments', { className: 'btn primary' })[0],
    ]);
  }

  FC.AppointmentNotFound = AppointmentNotFound;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
