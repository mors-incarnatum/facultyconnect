(function (FC) {
  'use strict';

  function mountFacultyConnectApp(rootEl) {
    return FC.mountPageRouter(rootEl);
  }

  FC.mountFacultyConnectApp = mountFacultyConnectApp;
})(globalThis.FC = globalThis.FC || {});
