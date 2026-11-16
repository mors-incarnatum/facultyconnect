(function (FC, $) {
  'use strict';

  const { openModal } = FC;

  function openScheduleDraftGuard({ error = '', onSave, onDiscard, onStay }) {
    const $section = $('<section>')
      .attr({ role: 'region', 'aria-label': 'Unsaved availability draft' });

    const $error = $('<p>').attr('role', 'alert');
    if (error) {
      $error.text(error);
      $section.append($error);
    }

    const $saveBtn = $('<button>')
      .attr({ type: 'button', autofocus: 'autofocus' })
      .addClass('btn primary')
      .text('Save')
      .on('click', () => onSave());

    const $discardBtn = $('<button>')
      .attr('type', 'button')
      .addClass('btn')
      .text('Discard')
      .on('click', () => onDiscard());

    const $stayBtn = $('<button>')
      .attr('type', 'button')
      .addClass('btn')
      .text('Stay')
      .on('click', () => onStay());

    const $actions = $('<div>').addClass('modal-actions').append($saveBtn, $discardBtn, $stayBtn);
    $section.append($actions);

    const modal = openModal({
      title: 'Keep your availability changes?',
      description: 'Save to publish, discard the draft, or stay here.',
      onClose: onStay,
      className: 'draft-dialog',
      children: $section,
    });

    modal.setError = (errMsg) => {
      if (errMsg) {
        $error.text(errMsg);
        if (!$error.parent().length) {
          $section.prepend($error);
        }
      } else {
        $error.remove();
      }
    };

    return modal;
  }

  FC.openScheduleDraftGuard = openScheduleDraftGuard;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
