import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

function Modal({ title, description, children, onClose, className = '' }) {
    const dialog = useRef(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(function () {
        const element = dialog.current;
        const opener = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        element.showModal();
        return function () {
            element.close();
            document.body.style.overflow = previousOverflow;
            if (opener && opener.isConnected) {
                opener.focus({ preventScroll: true });
            }
        };
    }, []);

    function handleBackdrop(event) {
        if (event.target !== event.currentTarget) {
            return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            onClose();
        }
    }

    function handleKeyDown(event) {
        if (event.key !== 'Tab') {
            return;
        }
        const controls = Array.from(
            event.currentTarget.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')
        ).filter(function (element) {
            return !element.disabled && element.tabIndex >= 0 && element.getClientRects().length;
        });
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            if (last) {
                last.focus();
            }
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            if (first) {
                first.focus();
            }
        }
    }

    return createPortal(
        <dialog
            ref={dialog}
            className={`modal-dialog ${className}`}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onClick={handleBackdrop}
            onKeyDown={handleKeyDown}
            onCancel={function (event) {
                event.preventDefault();
                onClose();
            }}
        >
            <div className="modal-panel">
                <h2 id={titleId}>{title}</h2>
                {description && <p className="muted" id={descriptionId}>{description}</p>}
                {children}
            </div>
        </dialog>,
        document.body
    );
}

export default Modal;
