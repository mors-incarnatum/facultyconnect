import { useId } from 'react';

function Field({ label, as = 'input', error, children, className = '', ...props }) {
    const Tag = as;
    const labelId = useId();
    const errorId = `${labelId}-error`;
    const describedBy = [props['aria-describedby'], error ? errorId : '']
        .filter(Boolean)
        .join(' ') || undefined;

    const control = Object.assign({}, props, {
        'aria-labelledby': labelId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
    });

    return (
        <label className={`field ${error ? 'invalid' : ''} ${className}`}>
            <span id={labelId}>
                {label}{props.required ? ' (required)' : ''}
            </span>
            {as === 'select' ? <select {...control}>{children}</select> : <Tag {...control} />}
            {error && <span className="field-error" id={errorId}>{error}</span>}
        </label>
    );
}

export default Field;
