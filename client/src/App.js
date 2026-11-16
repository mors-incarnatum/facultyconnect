(function (FC) {
  'use strict';

  function mountApp(rootEl) {
    return FC.mountFacultyConnectApp(rootEl);
  }

  FC.mountApp = mountApp;
})(globalThis.FC = globalThis.FC || {});
