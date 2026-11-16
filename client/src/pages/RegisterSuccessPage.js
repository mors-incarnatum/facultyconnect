(function (FC, $) {
  'use strict';

  const { AuthLayout, createLink, getLocation } = FC;

  function createRegisterSuccessPage() {
    const $root = $('<div>');

    const render = () => {
      document.title = 'FacultyConnect';
      const { state } = getLocation();
      const role = state?.role || 'student';

      $root.empty();

      const $card = $('<div>').addClass('auth-card').append(
        $('<span>').addClass('badge confirmed').text('Account created'),
        $('<h1>')
          .css('margin-top', '14px')
          .text(`${role === 'faculty' ? 'Faculty' : 'Student'} account created`),
        $('<p>')
          .addClass('muted')
          .text(
            `${state?.name ? `Welcome, ${state.name}. ` : ''}Your account is ready. Sign in to ${role === 'faculty' ? 'publish your consultation schedule' : 'find faculty and request consultations'}.`,
          ),
        $('<div>')
          .addClass('btn-row')
          .append(
            createLink('/login', 'Sign in', {
              className: 'btn primary',
              state: { email: state?.email, from: state?.from },
            }),
            createLink('/', 'Back to home', { className: 'btn' }),
          ),
      );

      $root.append(AuthLayout($card));
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
    };
  }

  FC.createRegisterSuccessPage = createRegisterSuccessPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
