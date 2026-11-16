(function (FC, $) {
  'use strict';

  const { createLink, getLocation } = FC;

  /** Shared orientation for nested views, with links back to their owning section. */
  function WorkspaceTrail({ role }) {
    const { pathname } = getLocation();
    const booking =
      role === 'student' &&
      (pathname.includes('/faculty') ||
        pathname.includes('/request') ||
        pathname.includes('/booking-conflict'));

    if (!booking) return null;

    const section = 'Find faculty';
    const parent = '/student/faculty';

    return $('<nav>')
      .addClass('workspace-trail')
      .attr('aria-label', 'Breadcrumb')
      .append(
        createLink(`/${role}`, 'Workspace'),
        $('<span>').attr('aria-hidden', 'true').text('/'),
        pathname === parent
          ? $('<span>').attr('aria-current', 'page').text(section)
          : createLink(parent, section, {
              attrs: { 'aria-label': `Return to ${section.toLowerCase()}` },
            }),
      );
  }

  FC.WorkspaceTrail = WorkspaceTrail;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
