(function (FC, $) {
  'use strict';

  const { createLink, getLocation } = FC;

  function AvailabilityTabs({ children = null } = {}) {
    const { pathname } = getLocation();
    const $nav = $('<nav>').addClass('availability-tabs').attr('aria-label', 'Availability views');

    const isWeekly = pathname === '/faculty/availability';
    const isSlots = pathname === '/faculty/availability/slots';

    $nav.append(
      createLink('/faculty/availability', 'Weekly hours & exceptions', {
        className: `btn ${isWeekly ? 'primary' : ''}`.trim(),
        attrs: { 'aria-current': isWeekly ? 'page' : undefined },
      }),
      createLink('/faculty/availability/slots', 'Published slots', {
        className: `btn ${isSlots ? 'primary' : ''}`.trim(),
        attrs: { 'aria-current': isSlots ? 'page' : undefined },
      }),
    );

    if (children != null) {
      $nav.append(children);
    }

    return $nav;
  }

  FC.AvailabilityTabs = AvailabilityTabs;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
