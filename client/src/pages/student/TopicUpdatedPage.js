(function (FC, $) {
  'use strict';

  const { AppointmentOutcome } = FC;

  function createTopicUpdatedPage({ params }) {
    let currentParams = params;
    const $root = $('<div>');
    const render = () => $root.empty().append(AppointmentOutcome({ outcome: 'updated', params: currentParams }));
    render();
    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        render();
      },
    };
  }

  FC.createTopicUpdatedPage = createTopicUpdatedPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
