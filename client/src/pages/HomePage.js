(function (FC, $) {
  'use strict';

  const { Avatar, UNIVERSITY, initialFaculty, createLink, getApp } = FC;

  function createHomePage() {
    const $root = $('<div>');

    const render = () => {
      document.title = 'FacultyConnect';
      const { user } = getApp();
      $root.empty();

      const $hero = $('<header>').addClass('index-hero');
      const $nav = $('<div>').addClass('index-nav');

      $nav.append(
        $('<div>').append(
          $('<span>').addClass('brand').text('FacultyConnect'),
          $('<div>').addClass('muted small').text(UNIVERSITY),
        ),
      );

      const $navActions = $('<div>').addClass('btn-row').css('margin', 0);
      if (user) {
        $navActions.append(createLink(`/${user.role}`, 'Open my workspace', { className: 'btn primary' }));
      } else {
        $navActions.append(
          createLink('/register', 'Register', { className: 'btn' }),
          createLink('/login', 'Sign in', { className: 'btn primary' }),
        );
      }
      $nav.append($navActions);

      const $ctaRow = $('<div>').addClass('btn-row').css('margin-top', 0);
      $ctaRow.append(
        createLink(
          user ? `/${user.role}` : '/login',
          user ? 'Open my workspace' : 'Sign in to get started',
          { className: 'btn primary' },
        ),
      );
      if (!user) {
        $ctaRow.append(createLink('/register', 'Create an account', { className: 'btn' }));
      }

      const $valueGrid = $('<div>').addClass('value-grid').append(
        $('<div>').addClass('card').append(
          $('<h3>').text('See real availability'),
          $('<p>').addClass('muted').text('Students check open slots before they ask, so there is no back-and-forth over email.'),
        ),
        $('<div>').addClass('card').append(
          $('<h3>').text('No double bookings'),
          $('<p>').addClass('muted').text('A requested slot is held until the faculty member responds, and is re-checked on submit.'),
        ),
        $('<div>').addClass('card').append(
          $('<h3>').text('Prepared consultations'),
          $('<p>').addClass('muted').text('Every request carries a topic, so faculty can prepare before the meeting.'),
        ),
      );

      const $facultyGrid = $('<div>').css({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      });
      for (const f of initialFaculty.slice(0, 3)) {
        $facultyGrid.append(
          $('<div>')
            .addClass('card')
            .css({ display: 'flex', gap: '14px', alignItems: 'flex-start' })
            .append(
              Avatar({ person: f, size: 'lg' }),
              $('<div>')
                .css({ minWidth: 0, flex: 1 })
                .append(
                  $('<strong>').css({ display: 'block', fontSize: '15px' }).text(f.name),
                  $('<div>').addClass('muted small').css('margin-bottom', '6px').text(`${f.rank} · ${f.department}`),
                  $('<p>').addClass('muted small').css({ fontStyle: 'italic', margin: 0, lineHeight: 1.4 }).text(`“${f.motto}”`),
                ),
            ),
        );
      }

      const $guidesSection = $('<div>')
        .css({ marginTop: '48px', textAlign: 'left' })
        .append(
          $('<h2>').css({ fontSize: '22px', marginBottom: '6px', textAlign: 'center' }).text('Meet your CCS faculty guides'),
          $('<p>')
            .addClass('muted')
            .css({ textAlign: 'center', marginBottom: '24px', fontSize: '14px' })
            .text('Connect with professors across Software Technology, Computer Technology, and Information Technology.'),
          $facultyGrid,
        );

      $hero.append(
        $nav,
        $('<h1>').html('A little guidance.<br />A clearer path.'),
        $('<p>')
          .addClass('lead')
          .text(
            'FacultyConnect brings consultation scheduling into one place. Faculty publish their available times, students find the right person and request a slot, and both sides see the same appointment status.',
          ),
        $ctaRow,
        $valueGrid,
        $guidesSection,
      );

      $root.append($hero, $('<footer>').addClass('footer').text('FacultyConnect · CBAPDEV Group 2'));
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('auth') || reasons.has('data')) {
          render();
        }
      },
    };
  }

  FC.createHomePage = createHomePage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
