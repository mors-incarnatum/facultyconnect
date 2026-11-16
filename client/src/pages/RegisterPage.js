(function (FC, $) {
  'use strict';

  const { Field, AuthLayout, departments, createLink, getLocation, navigate, getApp } = FC;

  function createRegisterPage() {
    const { state } = getLocation();
    let role = state?.role === 'faculty' ? 'faculty' : 'student';
    const form = {
      name: '',
      email: '',
      password: '',
      confirm: '',
      department: departments[0],
    };
    let error = '';
    const $root = $('<div>');

    const render = () => {
      document.title = 'FacultyConnect';
      const { register } = getApp();
      const locState = getLocation().state;
      $root.empty();

      const $form = $('<form>').addClass('auth-card').attr('novalidate', 'novalidate');
      const $errorBox = $('<div>').addClass('form-error').attr('role', 'alert');

      const showError = (msg) => {
        error = msg;
        if (msg) {
          $errorBox.text(msg);
          if (!$errorBox.parent().length) {
            $form.find('.toggle').after($errorBox);
          }
        } else {
          $errorBox.remove();
        }
      };

      const $toggle = $('<div>')
        .addClass('toggle')
        .attr({ role: 'group', 'aria-label': 'Account role' })
        .append(
          $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(role === 'student') })
            .text('Student')
            .on('click', () => {
              if (role !== 'student') {
                role = 'student';
                render();
              }
            }),
          $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(role === 'faculty') })
            .text('Faculty')
            .on('click', () => {
              if (role !== 'faculty') {
                role = 'faculty';
                render();
              }
            }),
        );

      $form.append(
        $('<h1>').text('Create your account'),
        $('<p>').addClass('muted').text('Choose your role and enter your account details.'),
        $toggle,
      );

      if (error) {
        $errorBox.text(error);
        $form.append($errorBox);
      }

      const handleChange = (event) => {
        const { name, value } = event.target;
        form[name] = value;
      };

      $form.append(
        Field({
          label: 'Full name',
          name: 'name',
          value: form.name,
          placeholder: 'Alex Dela Cruz',
          autoComplete: 'name',
          onChange: handleChange,
        }),
        Field({
          label: 'Email address',
          type: 'email',
          name: 'email',
          value: form.email,
          placeholder: 'firstname.lastname@dlsu.edu.ph',
          autoComplete: 'email',
          onChange: handleChange,
        }),
      );

      if (role === 'faculty') {
        const $options = departments.map((d) => $('<option>').val(d).text(d));
        $form.append(
          Field({
            label: 'Department',
            as: 'select',
            name: 'department',
            value: form.department,
            children: $options,
            onChange: handleChange,
          }),
        );
      }

      $form.append(
        Field({
          label: 'Password',
          type: 'password',
          name: 'password',
          value: form.password,
          autoComplete: 'new-password',
          onChange: handleChange,
        }),
        Field({
          label: 'Confirm password',
          type: 'password',
          name: 'confirm',
          value: form.confirm,
          autoComplete: 'new-password',
          onChange: handleChange,
        }),
        $('<button>').addClass('btn primary block').attr('type', 'submit').text('Create account'),
        $('<p>').addClass('hint').text('After creating your account, sign in to continue.'),
        $('<p>')
          .addClass('foot')
          .append(createLink('/login', 'Already have an account? Sign in', { state: locState })),
      );

      $form.on('submit', (event) => {
        event.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.password) {
          showError('Please complete every field.');
          return;
        }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
          showError('Enter a valid email address.');
          return;
        }
        if (form.password.length < 8) {
          showError('Use a password with at least 8 characters.');
          return;
        }
        if (form.password !== form.confirm) {
          showError('Passwords do not match.');
          return;
        }
        const res = register({
          role,
          name: form.name.trim(),
          email: form.email,
          department: form.department,
        });
        if (!res.ok) {
          showError(res.error);
          return;
        }
        navigate('/register/success', {
          state: {
            role,
            name: form.name.trim(),
            email: form.email.trim(),
            from: locState?.from,
          },
        });
      });

      $root.append(AuthLayout($form));
    };

    render();

    return {
      $el: $root,
      update() {
        render();
      },
    };
  }

  FC.createRegisterPage = createRegisterPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
