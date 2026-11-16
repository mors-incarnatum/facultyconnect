(function (FC, $) {
  'use strict';

  $(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      FC.mountApp(rootEl);
    }
  });
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
