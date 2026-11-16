(function (FC, $) {
  'use strict';

  let modalSeq = 0;

  function openModal({ title, description = '', children = null, onClose, className = '' }) {
    const seq = ++modalSeq;
    const titleId = `fc-modal-title-${seq}`;
    const descriptionId = `fc-modal-desc-${seq}`;

    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    let closed = false;

    const $dialog = $('<dialog>')
      .addClass(`modal-dialog ${className}`.trim())
      .attr({
        'aria-labelledby': titleId,
        'aria-describedby': description ? descriptionId : null,
      });

    const $panel = $('<div>').addClass('modal-panel');
    $panel.append($('<h2>').attr('id', titleId).text(title));
    if (description) {
      $panel.append($('<p>').addClass('muted').attr('id', descriptionId).text(description));
    }
    if (children != null) {
      $panel.append(children);
    }
    $dialog.append($panel);

    const close = ({ restoreFocus = true } = {}) => {
      if (closed) return;
      closed = true;
      const dialogEl = $dialog[0];
      if (dialogEl?.open) {
        dialogEl.close();
      }
      $dialog.remove();
      document.body.style.overflow = previousOverflow;
      if (restoreFocus && opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };

    $dialog.on('click', (event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        onClose?.();
      }
    });

    $dialog.on('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = [
        ...event.currentTarget.querySelectorAll(
          'a[href], button, input, select, textarea, summary, [tabindex]',
        ),
      ].filter((el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });

    $dialog.on('cancel', (event) => {
      event.preventDefault();
      onClose?.();
    });

    $(document.body).append($dialog);
    document.body.style.overflow = 'hidden';
    $dialog[0].showModal();

    const autofocusEl = $dialog[0].querySelector('[autofocus]');
    if (autofocusEl && document.activeElement !== autofocusEl) {
      autofocusEl.focus({ preventScroll: true });
    }

    return { $dialog, $panel, close };
  }

  FC.openModal = openModal;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
