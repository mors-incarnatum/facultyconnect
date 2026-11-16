(function (FC, $) {
  'use strict';

  const { createLink, PageHead } = FC;

  function MissingRecord({ availability = false } = {}) {
    return $([
      PageHead({
        title: availability ? 'Time slot unavailable' : 'Consultation not found',
        subtitle: 'This record is no longer available in your workspace.',
      })[0],
      createLink(
        availability ? '/faculty/availability/slots' : '/faculty/consultations',
        `Back to ${availability ? 'availability' : 'consultations'}`,
        { className: 'btn' },
      )[0],
    ]);
  }

  FC.MissingRecord = MissingRecord;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
