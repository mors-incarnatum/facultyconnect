import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ title, description, children, onClose, className = '' }) => {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const handleBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')]
      .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return createPortal(
    <dialog
      ref={dialog}
      className={`modal-dialog ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdrop}
      onKeyDown={handleKeyDown}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <div className="modal-panel">
        <h2 id={titleId}>{title}</h2>
        {description && <p className="muted" id={descriptionId}>{description}</p>}
        {children}
      </div>
    </dialog>,
    document.body,
  );
};

export default Modal;
