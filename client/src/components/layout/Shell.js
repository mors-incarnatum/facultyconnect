(function (FC, $) {
  'use strict';

  const {
    SEMESTER,
    UNIVERSITY,
    createLink,
    getLocation,
    navigate,
    getApp,
    todayLabel,
    Avatar,
    openScheduleDraftGuard,
    WorkspaceTrail,
  } = FC;

  const NAV = {
    faculty: [
      { to: '/faculty', label: 'Overview', end: true },
      { to: '/faculty/availability', label: 'My availability' },
      { to: '/faculty/consultations', label: 'Consultations' },
    ],
    student: [
      { to: '/student', label: 'Overview', end: true },
      {
        to: '/student/faculty',
        label: 'Find faculty',
        also: ['/student/request', '/student/booking-conflict'],
      },
      { to: '/student/appointments', label: 'My appointments' },
    ],
  };

  function createShell(role) {
    const scrollPositions = {};
    let menuOpen = false;
    let guardModal = null;
    let currentPathname = getLocation().pathname;
    let lastFocusedPathname = null;

    const $shell = $('<div>').addClass(`shell workspace-v2 workspace-${role}`);
    const $aside = $('<aside>').addClass('sidebar');
    const $main = $('<main>').addClass('main').attr({ id: 'workspace-content', tabindex: '-1' });

    const $skip = $('<a>')
      .addClass('skip-link')
      .attr('href', '#workspace-content')
      .text('Skip to content')
      .on('click', (event) => {
        event.preventDefault();
        $main[0]?.focus();
      });

    const $mobileBar = $('<div>').addClass('mobile-bar');
    const $menuBtn = $('<button>')
      .addClass('btn sm')
      .attr('aria-expanded', 'false')
      .text('Menu')
      .on('click', () => {
        menuOpen = !menuOpen;
        $aside.toggleClass('open', menuOpen);
        $menuBtn.attr('aria-expanded', String(menuOpen)).text(menuOpen ? 'Close' : 'Menu');
      });

    const $nav = $('<nav>').addClass('nav').attr('aria-label', 'Primary').on('click', () => {
      menuOpen = false;
      $aside.removeClass('open');
      $menuBtn.attr('aria-expanded', 'false').text('Menu');
    });

    const $collapsibleTop = $('<div>').addClass('collapsible');
    const $collapsibleFoot = $('<div>').addClass('sidebar-foot collapsible');
    $aside.append($mobileBar, $collapsibleTop, $collapsibleFoot);

    const $topline = $('<div>').addClass('topline');
    const $eyebrow = $('<span>').addClass('eyebrow').text('Your academic connections');
    const $clockSpan = $('<span>');
    $topline.append($eyebrow, $clockSpan);

    const $feedbackWrap = $('<div>');
    const $trailWrap = $('<div>');
    const $outlet = $('<div>');

    $main.append($topline, $feedbackWrap, $trailWrap, $outlet);
    $shell.append($skip, $aside, $main);

    const closeGuard = () => {
      if (guardModal) {
        guardModal.close({ restoreFocus: true });
        guardModal = null;
      }
    };

    const finishLeaving = (target) => {
      closeGuard();
      const { signOut } = getApp();
      if (target === 'logout') {
        signOut();
        navigate('/');
      } else {
        navigate(target);
      }
    };

    const openLeavingGuard = (target) => {
      closeGuard();
      guardModal = openScheduleDraftGuard({
        error: '',
        onSave: () => {
          const { scheduleDraft, saveFacultySchedule } = getApp();
          const result = saveFacultySchedule(scheduleDraft);
          if (!result.ok) {
            guardModal?.setError(result.error);
            return;
          }
          finishLeaving(target);
        },
        onDiscard: () => {
          const { setScheduleDraft } = getApp();
          setScheduleDraft(null);
          finishLeaving(target);
        },
        onStay: () => {
          closeGuard();
        },
      });
    };

    const handleCaptureClick = (event) => {
      const { scheduleDraft } = getApp();
      const anchor = event.target.closest('a');
      const target = anchor?.getAttribute('href')?.replace(/^#/, '');
      if (
        scheduleDraft &&
        target?.startsWith('/') &&
        !target.startsWith('/faculty/availability') &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        openLeavingGuard(target);
      }
    };

    $shell[0].addEventListener('click', handleCaptureClick, true);

    const handleScroll = () => {
      scrollPositions[currentPathname] = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    const renderFeedback = () => {
      const { feedback, setFeedback } = getApp();
      $feedbackWrap.empty();
      if (feedback) {
        $feedbackWrap.append(
          $('<div>')
            .addClass('feedback feedback-toast')
            .attr({ role: 'status', 'aria-live': 'polite' })
            .append(
              $('<span>').text(feedback),
              $('<button>')
                .attr({ type: 'button', 'aria-label': 'Dismiss notification' })
                .text('×')
                .on('click', () => setFeedback('')),
            ),
        );
      }
    };

    const renderChrome = () => {
      const { now, user, signOut } = getApp();
      const { pathname } = getLocation();
      currentPathname = pathname;

      const isActive = (item) =>
        item.end
          ? pathname === item.to
          : [item.to, ...(item.also || [])].some((p) => pathname.startsWith(p));

      $aside.toggleClass('open', menuOpen);
      $menuBtn.attr('aria-expanded', String(menuOpen)).text(menuOpen ? 'Close' : 'Menu');
      $mobileBar.empty().append(
        createLink(`/${role}`, 'FacultyConnect', { className: 'brand' }),
        $menuBtn,
      );

      $nav.empty();
      for (const item of NAV[role]) {
        const active = isActive(item);
        $nav.append(
          createLink(item.to, item.label, {
            className: active ? 'active' : '',
            attrs: { 'aria-current': active ? 'page' : undefined },
          }),
        );
      }

      $collapsibleTop.empty().append(
        createLink(`/${role}`, 'FacultyConnect', { className: 'brand' }),
        $('<div>').addClass('brand-sub').text(UNIVERSITY),
        $('<hr>'),
        $('<div>').addClass('nav-label').text(`${role} workspace`),
        $nav,
        $('<div>')
          .addClass('semester')
          .append(
            $('<strong>').text(SEMESTER),
            $('<span>').text('A little guidance goes a long way.'),
          ),
      );

      $collapsibleFoot.empty().append(
        $('<div>')
          .addClass('sidebar-identity')
          .append(
            Avatar({ person: user, size: 'sm' }),
            $('<div>')
              .css('min-width', 0)
              .append(
                $('<div>')
                  .addClass('who')
                  .css({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })
                  .text(user.name),
                $('<div>')
                  .addClass('role')
                  .text(role === 'student' ? 'Student' : user.department),
              ),
          ),
        createLink(`/${role}/help`, 'Help & support', {
          attrs: { 'aria-current': pathname === `/${role}/help` ? 'page' : undefined },
        }),
        $('<button>')
          .addClass('link-btn')
          .text('Log out →')
          .on('click', () => {
            const { scheduleDraft } = getApp();
            if (scheduleDraft) {
              openLeavingGuard('logout');
              return;
            }
            signOut();
            navigate('/');
          }),
        $('<p>').addClass('session-note').text('Session workspace · changes reset on reload.'),
      );

      $clockSpan.text(todayLabel(now));
      renderFeedback();

      $trailWrap.empty();
      const trail = WorkspaceTrail({ role });
      if (trail) $trailWrap.append(trail);
    };

    const afterRouteRender = (isNewPathname) => {
      const { pathname, state } = getLocation();
      if (isNewPathname || lastFocusedPathname !== pathname) {
        lastFocusedPathname = pathname;
        menuOpen = false;
        $aside.removeClass('open');
        $menuBtn.attr('aria-expanded', 'false').text('Menu');

        const { setFeedback } = getApp();
        setFeedback(state?.feedback || '');
        renderFeedback();

        const heading = $main[0]?.querySelector('h1');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
          document.title = `${heading.textContent} · FacultyConnect`;
        }
        window.scrollTo(0, state?.returnScroll ?? scrollPositions[pathname] ?? 0);
      }
    };

    return {
      role,
      $el: $shell,
      $outlet,
      $clockSpan,
      renderChrome,
      renderFeedback,
      afterRouteRender,
      updateClock() {
        $clockSpan.text(todayLabel(getApp().now));
      },
      destroy() {
        closeGuard();
        $shell[0]?.removeEventListener('click', handleCaptureClick, true);
        window.removeEventListener('scroll', handleScroll);
      },
    };
  }

  FC.createShell = createShell;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
