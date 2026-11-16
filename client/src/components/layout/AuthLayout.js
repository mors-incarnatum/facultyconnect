(function (FC, $) {
  'use strict';

  const { UNIVERSITY, createLink } = FC;

  function AuthLayout(children) {
    const $auth = $('<div>').addClass('auth');
    const $side = $('<aside>').addClass('auth-side');

    $side.append(
      createLink('/', 'FacultyConnect', { className: 'brand' }),
      $('<div>').addClass('muted small').css('margin-top', '14px').text(UNIVERSITY),
      $('<div>')
        .addClass('tag')
        .append(
          $('<h2>').html('A little guidance.<br />A clearer path.'),
          $('<p>').text(
            'Find faculty availability, request a consultation, and keep every appointment in one place.',
          ),
          $('<div>').addClass('line'),
          $('<strong>').text('For students and faculty members'),
        ),
    );

    const $main = $('<div>').addClass('auth-main');
    if (children != null) {
      $main.append(children);
    }

    $auth.append($side, $main);
    return $auth;
  }

  FC.AuthLayout = AuthLayout;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
