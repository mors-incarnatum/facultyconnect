(function (FC, $) {
  'use strict';

  const { Field, AuthLayout, createLink, getLocation, navigate, getApp } = FC;

  function createLoginPage() {
    const { state } = getLocation();
    const form = { email: state?.email || '', password: '' };
    let error = '';
    const $root = $('<div>');

    const destination = (role) => {
      const from = getLocation().state?.from;
      return typeof from === 'string' &&
        (from === `/${role}` || from.startsWith(`/${role}/`) || from.startsWith(`/${role}?`))
        ? from
        : `/${role}`;
    };

    const render = () => {
      document.title = 'FacultyConnect';
      const { signIn, user } = getApp();
      if (user) {
        navigate(destination(user.role), { replace: true });
        return;
      }

      $root.empty();

      const $form = $('<form>').addClass('auth-card').attr('novalidate', 'novalidate');
      const $errorBox = $('<div>').addClass('form-error').attr('role', 'alert');

      const showError = (msg) => {
        error = msg;
        if (msg) {
          $errorBox.text(msg);
          if (!$errorBox.parent().length) {
            $form.find('p.muted').first().after($errorBox);
          }
        } else {
          $errorBox.remove();
        }
      };

      const $emailField = Field({
        name: 'email',
        label: 'Email address',
        type: 'email',
        value: form.email,
        autoComplete: 'username',
        onChange: (event) => {
          form.email = event.target.value;
        },
      });

      const $passwordField = Field({
        name: 'password',
        label: 'Password',
        type: 'password',
        value: form.password,
        autoComplete: 'current-password',
        onChange: (event) => {
          form.password = event.target.value;
        },
      });

      $form.append(
        $('<h1>').text('Welcome back'),
        $('<p>').addClass('muted').text('Sign in with your account email and password.'),
      );
      if (error) {
        $errorBox.text(error);
        $form.append($errorBox);
      }
      $form.append(
        $emailField,
        $passwordField,
        $('<button>').addClass('btn primary block').attr('type', 'submit').text('Sign in'),
        $('<p>').addClass('hint').text('Your account role determines the workspace you can access.'),
        $('<p>')
          .addClass('foot')
          .append(createLink('/register', 'New to FacultyConnect? Register', { state: getLocation().state })),
      );

      $form.on('submit', (event) => {
        event.preventDefault();
        if (!form.email.trim() || !form.password) {
          showError('Enter your email address and password.');
          return;
        }
        const res = signIn(form.email);
        if (!res.ok) {
          showError(res.error);
          return;
        }
        navigate(destination(res.role), { replace: true });
      });

      $root.append(AuthLayout($form));
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
      onStoreUpdate(reasons) {
        if (reasons.has('auth')) render();
      },
    };
  }

  FC.createLoginPage = createLoginPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
