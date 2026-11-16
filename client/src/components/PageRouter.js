(function (FC, $) {
  'use strict';

  const {
    clearPendingStoreReasons,
    getApp,
    subscribeStore,
    getLocation,
    matchPath,
    navigate,
    subscribeRouter,
    createShell,
  } = FC;

  const getRoutes = () => [
    { pattern: '/', role: null, key: 'home', factory: () => FC.createHomePage() },
    { pattern: '/login', role: null, key: 'login', factory: () => FC.createLoginPage() },
    { pattern: '/register', role: null, key: 'register', factory: () => FC.createRegisterPage() },
    { pattern: '/register/success', role: null, key: 'register-success', factory: () => FC.createRegisterSuccessPage() },

    { pattern: '/student', role: 'student', key: 'student-overview', factory: () => FC.createStudentOverviewPage() },
    { pattern: '/student/faculty', role: 'student', key: 'student-faculty', factory: (ctx) => FC.createFacultySearchPage({ ...ctx, view: 'list' }), view: 'list' },
    { pattern: '/student/faculty/calendar', role: 'student', key: 'student-faculty', factory: (ctx) => FC.createFacultySearchPage({ ...ctx, view: 'calendar' }), view: 'calendar' },
    { pattern: '/student/faculty/:id', role: 'student', key: 'student-faculty-profile', factory: (ctx) => FC.createFacultyProfilePage(ctx) },
    { pattern: '/student/request', role: 'student', key: 'student-request', factory: () => FC.createRequestPage() },
    { pattern: '/student/request/submitted/:id', role: 'student', key: 'student-request-submitted', factory: (ctx) => FC.createRequestSubmittedPage(ctx) },
    { pattern: '/student/appointments', role: 'student', key: 'student-appointments', factory: () => FC.createAppointmentsPage() },
    { pattern: '/student/appointments/:id/edit-topic', role: 'student', key: 'student-edit-topic', factory: (ctx) => FC.createEditTopicPage(ctx) },
    { pattern: '/student/appointments/:id/topic-updated', role: 'student', key: 'student-topic-updated', factory: (ctx) => FC.createTopicUpdatedPage(ctx) },
    { pattern: '/student/appointments/:id/delete-topic', role: 'student', key: 'student-delete-topic', factory: (ctx) => FC.createDeleteTopicPage(ctx) },
    { pattern: '/student/appointments/:id/topic-deleted', role: 'student', key: 'student-topic-deleted', factory: (ctx) => FC.createTopicDeletedPage(ctx) },
    { pattern: '/student/appointments/:id/cancel', role: 'student', key: 'student-cancel', factory: (ctx) => FC.createCancelAppointmentPage(ctx) },
    { pattern: '/student/appointments/:id/cancelled', role: 'student', key: 'student-cancelled', factory: (ctx) => FC.createAppointmentCancelledPage(ctx) },
    { pattern: '/student/booking-conflict', role: 'student', key: 'student-booking-conflict', factory: () => FC.createBookingConflictPage() },
    { pattern: '/student/help', role: 'student', key: 'student-help', factory: () => FC.createStudentHelpPage() },

    { pattern: '/faculty', role: 'faculty', key: 'faculty-overview', factory: () => FC.createFacultyOverviewPage() },
    { pattern: '/faculty/consultations', role: 'faculty', key: 'faculty-consultations', factory: () => FC.createConsultationsPage() },
    { pattern: '/faculty/consultations/:id', role: 'faculty', key: 'faculty-consultation-details', factory: (ctx) => FC.createConsultationDetailsPage(ctx) },
    { pattern: '/faculty/consultations/:id/updated', role: 'faculty', key: 'faculty-consultation-updated', factory: (ctx) => FC.createConsultationUpdatedPage(ctx) },
    { pattern: '/faculty/availability', role: 'faculty', key: 'faculty-availability', factory: () => FC.createAvailabilityPage() },
    { pattern: '/faculty/availability/slots', role: 'faculty', key: 'faculty-availability-slots', factory: () => FC.createPublishedSlotsPage() },
    { pattern: '/faculty/availability/new', role: 'faculty', redirect: '/faculty/availability#add-slot' },
    { pattern: '/faculty/availability/:id/edit', role: 'faculty', key: 'faculty-slot-edit', factory: (ctx) => FC.createSlotFormPage(ctx) },
    { pattern: '/faculty/availability/:id/remove', role: 'faculty', key: 'faculty-slot-remove', factory: (ctx) => FC.createRemoveSlotPage(ctx) },
    { pattern: '/faculty/availability/saved', role: 'faculty', key: 'faculty-availability-saved', factory: () => FC.createAvailabilityOutcomePage({ removed: false }), removed: false },
    { pattern: '/faculty/availability/removed', role: 'faculty', key: 'faculty-availability-removed', factory: () => FC.createAvailabilityOutcomePage({ removed: true }), removed: true },
    { pattern: '/faculty/help', role: 'faculty', key: 'faculty-help', factory: () => FC.createFacultyHelpPage() },
  ];

  function resolveRoute(pathname) {
    for (const route of getRoutes()) {
      const params = matchPath(route.pattern, pathname);
      if (params) {
        return { route, params };
      }
    }
    return null;
  }

  function mountPageRouter(rootEl) {
    const $container = $(rootEl);
    let activeShell = null;
    let activePage = null;
    let activeRouteKey = null;
    let activePathname = null;
    let renderGen = 0;

    const destroyPage = () => {
      if (activePage) {
        activePage.destroy?.();
        activePage.$el?.remove();
        activePage = null;
        activeRouteKey = null;
      }
    };

    const destroyShell = () => {
      destroyPage();
      if (activeShell) {
        activeShell.destroy?.();
        activeShell.$el?.remove();
        activeShell = null;
      }
    };

    const renderRoute = () => {
      const gen = ++renderGen;
      clearPendingStoreReasons();
      const loc = getLocation();
      const resolved = resolveRoute(loc.pathname);

      if (!resolved) {
        navigate('/', { replace: true });
        return;
      }

      const { route, params } = resolved;

      if (route.redirect) {
        if (route.role) {
          const { user } = getApp();
          if (!user) {
            navigate('/login', {
              replace: true,
              state: { from: loc.pathname + loc.search, role: route.role },
            });
            return;
          }
          if (user.role !== route.role) {
            navigate(`/${user.role}`, { replace: true });
            return;
          }
        }
        navigate(route.redirect, { replace: true });
        return;
      }

      if (route.role) {
        const { user } = getApp();
        if (!user) {
          destroyShell();
          navigate('/login', {
            replace: true,
            state: { from: loc.pathname + loc.search, role: route.role },
          });
          return;
        }
        if (user.role !== route.role) {
          destroyShell();
          navigate(`/${user.role}`, { replace: true });
          return;
        }
      }

      const isNewPathname = loc.pathname !== activePathname;
      activePathname = loc.pathname;

      const ctx = {
        params,
        location: loc,
        view: route.view,
        removed: route.removed,
      };

      if (route.role) {
        if (!activeShell || activeShell.role !== route.role) {
          destroyShell();
          activeShell = createShell(route.role);
          $container.empty().append(activeShell.$el);
        }
        activeShell.renderChrome();

        if (activePage && activeRouteKey === route.key) {
          activePage.update?.(ctx);
          if (gen !== renderGen) return;
        } else {
          destroyPage();
          const nextPage = route.factory(ctx);
          if (gen !== renderGen) {
            nextPage?.destroy?.();
            return;
          }
          activeRouteKey = route.key;
          activePage = nextPage;
          activeShell.$outlet.empty().append(activePage.$el);
        }
        activeShell.afterRouteRender(isNewPathname);
        clearPendingStoreReasons();
      } else {
        if (activeShell) {
          destroyShell();
        }
        if (activePage && activeRouteKey === route.key) {
          activePage.update?.(ctx);
          if (gen !== renderGen) return;
        } else {
          destroyPage();
          const nextPage = route.factory(ctx);
          if (gen !== renderGen) {
            nextPage?.destroy?.();
            return;
          }
          activeRouteKey = route.key;
          activePage = nextPage;
          $container.empty().append(activePage.$el);
        }
        if (isNewPathname) {
          window.scrollTo(0, 0);
        }
        clearPendingStoreReasons();
      }
    };

    renderRoute();

    const unsubRouter = subscribeRouter(() => {
      renderRoute();
    });

    const unsubStore = subscribeStore((reasons) => {
      if (reasons.has('auth')) {
        renderRoute();
        return;
      }
      if (reasons.has('clock') && activeShell) {
        activeShell.updateClock();
      }
      if (reasons.has('feedback') && activeShell) {
        activeShell.renderFeedback();
      }
      activePage?.onStoreUpdate?.(reasons);
    });

    return () => {
      unsubRouter();
      unsubStore();
      destroyShell();
    };
  }

  FC.mountPageRouter = mountPageRouter;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
