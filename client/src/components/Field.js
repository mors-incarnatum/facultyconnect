(function (FC, $) {
  'use strict';

  let fieldSeq = 0;

  function Field({
    label,
    as = 'input',
    error = '',
    children = null,
    className = '',
    onChange,
    value,
    required = false,
    disabled = false,
    autoFocus = false,
    'aria-describedby': extraDescribedBy = '',
    ...props
  }) {
    const seq = ++fieldSeq;
    const labelId = `fc-field-label-${seq}`;
    const errorId = `${labelId}-error`;

    const $label = $('<label>').addClass(`field ${error ? 'invalid' : ''} ${className}`.trim());
    const $labelText = $('<span>')
      .attr('id', labelId)
      .text(`${label}${required ? ' (required)' : ''}`);

    const $control = $(`<${as}>`).attr('aria-labelledby', labelId);
    if (required) $control.prop('required', true);
    if (disabled) $control.prop('disabled', true);
    if (autoFocus) $control.attr('autofocus', 'autofocus');

    for (const [key, val] of Object.entries(props)) {
      if (val === undefined || val === null || val === false) continue;
      if (key === 'autoComplete') {
        $control.attr('autocomplete', String(val));
      } else if (val === true) {
        $control.prop(key, true);
      } else {
        $control.attr(key, String(val));
      }
    }

    if (as === 'select' && children != null) {
      $control.append(children);
    }
    if (value !== undefined && value !== null) {
      $control.val(String(value));
    }

    const syncDescribedBy = (errText) => {
      const described = [extraDescribedBy, errText ? errorId : ''].filter(Boolean).join(' ');
      if (described) {
        $control.attr('aria-describedby', described);
      } else {
        $control.removeAttr('aria-describedby');
      }
    };
    syncDescribedBy(error);
    if (error) {
      $control.attr('aria-invalid', 'true');
    }

    $label.append($labelText, $control);

    let $errorEl = null;
    const setError = (errText) => {
      if (errText) {
        $label.addClass('invalid');
        $control.attr('aria-invalid', 'true');
        syncDescribedBy(errText);
        if (!$errorEl) {
          $errorEl = $('<span>').addClass('field-error').attr('id', errorId);
          $label.append($errorEl);
        }
        $errorEl.text(errText);
      } else {
        $label.removeClass('invalid');
        $control.removeAttr('aria-invalid');
        syncDescribedBy('');
        if ($errorEl) {
          $errorEl.remove();
          $errorEl = null;
        }
      }
    };

    if (error) {
      $errorEl = $('<span>').addClass('field-error').attr('id', errorId).text(error);
      $label.append($errorEl);
    }

    if (onChange) {
      if (as === 'select') {
        $control.on('change', onChange);
      } else {
        let lastVal = $control.val();
        $control.on('input change', (event) => {
          const nextVal = $control.val();
          if (event.type === 'change' && nextVal === lastVal) return;
          lastVal = nextVal;
          onChange(event);
        });
      }
    }

    $label.data('control', $control);
    $label.data('setError', setError);
    $label.$control = $control;
    $label.setError = setError;

    return $label;
  }

  FC.Field = Field;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
