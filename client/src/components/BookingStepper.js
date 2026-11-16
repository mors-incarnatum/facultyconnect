(function (FC, $) {
  'use strict';

  const STEPS = ['Faculty Chosen', 'Slot Selected', 'Add Topic', 'Confirmation'];

  function BookingStepper({ current = 3 } = {}) {
    const $ol = $('<ol>').addClass('booking-stepper').attr('aria-label', 'Consultation request progress');

    STEPS.forEach((label, index) => {
      const step = index + 1;
      const $li = $('<li>');
      if (step < current) $li.addClass('complete');
      if (step === current) $li.attr('aria-current', 'step');

      const $indicator = $('<span>')
        .addClass('step-indicator')
        .attr('aria-hidden', 'true')
        .text(step < current ? '✓' : String(step));

      const $text = $('<span>')
        .append($('<span>').addClass('sr-only').text('Step '))
        .append(document.createTextNode(`${step}. ${label}`));

      if (step < current) {
        $text.append($('<span>').addClass('sr-only').text(', completed'));
      }

      $li.append($indicator, $text);
      $ol.append($li);
    });

    return $ol;
  }

  FC.BookingStepper = BookingStepper;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
