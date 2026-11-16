(function (FC, $) {
  'use strict';

  const { AppointmentOutcome } = FC;

  function createTopicDeletedPage({ params }) {
    let currentParams = params;
    const $root = $('<div>');
    const render = () => $root.empty().append(AppointmentOutcome({ outcome: 'deleted', params: currentParams }));
    render();
    return {
      $el: $root,
      update(nextCtx) {
        currentParams = nextCtx?.params || currentParams;
        render();
      },
    };
  }

  FC.createTopicDeletedPage = createTopicDeletedPage;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
