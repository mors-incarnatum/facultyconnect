(function (FC, $) {
  'use strict';

  const { cap } = FC;

  function StatusBadge({ status }) {
    return $('<span>').addClass(`badge ${status}`).text(cap(status));
  }

  FC.StatusBadge = StatusBadge;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
