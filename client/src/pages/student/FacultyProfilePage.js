(function (FC, $) {
  'use strict';

  const {
    Avatar,
    PageHead,
    createLink,
    getLocation,
    getApp,
    fmtLong,
    fmtRange,
    modeLabel,
  } = FC;

  function createFacultyProfilePage({ params }) {
    let currentParams = params;
    const $root = $('<div>');

    const render = () => {
      const loc = getLocation();
      const { getFaculty, availableSlotsFor } = getApp();
      const f = getFaculty(currentParams.id);

      $root.empty();

      if (!f) {
        $root.append(
          PageHead({ title: 'Faculty member not found' }),
          createLink('/student/faculty', '← Back to faculty', { className: 'btn' }),
        );
        return;
      }

      const slots = availableSlotsFor(f.id);
      const backTarget =
        loc.state?.searchReturnTo ||
        (loc.state?.returnTo !== loc.pathname && loc.state?.returnTo) ||
        '/student/faculty';

      $root.append(
        PageHead({ title: f.name, subtitle: `${f.rank} · ${f.department}` }),
        $('<p>')
          .css('margin-bottom', '16px')
          .append(createLink(backTarget, '← Back to faculty', { state: loc.state })),
      );

      const $profileCard = $('<div>').addClass('card profile-card');
      const $h2Name = $('<h2>').addClass('profile-name').text(f.name);
      if (f.pronouns) {
        $h2Name.append($('<span>').addClass('profile-pronouns').text(f.pronouns));
      }

      $profileCard.append(
        $('<div>').addClass('profile-header').append(
          Avatar({ person: f, size: 'xl' }),
          $('<div>').addClass('profile-header-info').append(
            $h2Name,
            $('<div>').addClass('profile-rank').text(f.rank),
            $('<div>').addClass('profile-dept').text(`${f.department} · ${f.email}`),
            $('<div>').addClass('muted small').text(`Office: ${f.office}`),
          ),
        ),
      );

      if (f.motto) {
        $profileCard.append($('<blockquote>').addClass('profile-quote').text(`“${f.motto}”`));
      }

      $profileCard.append(
        $('<div>').append(
          $('<h3>').addClass('profile-section-title').text('About'),
          $('<p>').css({ lineHeight: 1.6, margin: 0 }).text(f.bio),
        ),
      );

      if (f.specialties?.length) {
        const $tags = $('<div>').addClass('profile-tags');
        for (const spec of f.specialties) {
          $tags.append($('<span>').addClass('profile-tag highlight').text(spec));
        }
        $profileCard.append(
          $('<div>').append($('<h3>').addClass('profile-section-title').text('Specialties & Research Interests'), $tags),
        );
      }

      if (f.consultationTip) {
        $profileCard.append(
          $('<div>').addClass('profile-tip').append(
            $('<span>').addClass('profile-tip-icon').attr('aria-hidden', 'true').text('💡'),
            $('<div>').append($('<strong>').text('How to prepare for our consultation:'), $('<div>').text(f.consultationTip)),
          ),
        );
      }

      if (f.consultationStyle) {
        $profileCard.append(
          $('<div>').append(
            $('<h3>').addClass('profile-section-title').text('Consultation Style'),
            $('<p>').addClass('muted').css({ margin: 0, fontSize: '14px' }).text(f.consultationStyle),
          ),
        );
      }

      if (f.officeHoursVibe) {
        $profileCard.append(
          $('<div>').append(
            $('<h3>').addClass('profile-section-title').text('Office & Meeting Vibe'),
            $('<p>').addClass('muted').css({ margin: 0, fontSize: '14px' }).text(f.officeHoursVibe),
          ),
        );
      }

      $profileCard.append($('<hr>').addClass('divider').css('margin', '4px 0'));

      const $kv = $('<dl>').addClass('kv');
      if (f.education) {
        $kv.append($('<dt>').text('Education'), $('<dd>').text(f.education));
      }
      const $courseTags = $('<div>').addClass('profile-tags').css('margin-top', '2px');
      if (f.courses?.length) {
        for (const c of f.courses) {
          $courseTags.append($('<span>').addClass('profile-tag').text(c));
        }
      } else {
        $courseTags.text('—');
      }
      $kv.append(
        $('<dt>').text('Department'),
        $('<dd>').text(f.department),
        $('<dt>').text('Subjects'),
        $('<dd>').text(f.subjects?.join(', ') || '—'),
        $('<dt>').text('Courses'),
        $('<dd>').append($courseTags),
        $('<dt>').text('Office'),
        $('<dd>').text(f.office),
      );
      $profileCard.append($kv);

      const $slotsCard = $('<div>').addClass('card').append(
        $('<h2>').css({ fontSize: '22px', marginBottom: '12px' }).text('Available times'),
      );
      if (!slots.length) {
        $slotsCard.append($('<p>').addClass('muted').text('No open consultation times right now.'));
      }
      for (const s of slots) {
        $slotsCard.append(
          $('<div>')
            .css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderTop: '1px solid var(--line)',
            })
            .append(
              $('<div>').append(
                $('<strong>').text(fmtLong(s.date)),
                $('<div>').addClass('muted small').text(`${fmtRange(s.start, s.end)} · ${modeLabel(s)}`),
              ),
              createLink(`/student/request?slot=${s.id}`, 'Request', {
                className: 'btn sm',
                state: {
                  ...loc.state,
                  searchReturnTo: loc.state?.searchReturnTo || loc.state?.returnTo,
                  returnTo: loc.pathname,
                },
              }),
            ),
        );
      }

      $root.append($('<div>').addClass('two-col').append($profileCard, $slotsCard));
    };

    render();

    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('data') || reasons.has('clock')) render();
      },
    };
  }

  FC.createFacultyProfilePage = createFacultyProfilePage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
