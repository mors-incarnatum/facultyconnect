const STEPS = ['Faculty Chosen', 'Slot Selected', 'Add Topic', 'Confirmation'];

function BookingStepper({ current = 3 }) {
    return (
        <ol className="booking-stepper" aria-label="Consultation request progress">
            {STEPS.map(function (label, index) {
                const step = index + 1;
                return (
                    <li
                        key={label}
                        className={step < current ? 'complete' : ''}
                        aria-current={step === current ? 'step' : undefined}
                    >
                        <span className="step-indicator" aria-hidden="true">
                            {step < current ? '✓' : step}
                        </span>
                        <span>
                            <span className="sr-only">Step </span>
                            {step}. {label}
                            {step < current && <span className="sr-only">, completed</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

export default BookingStepper;
