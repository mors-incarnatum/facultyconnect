(function (FC, $) {
  'use strict';

  function PageHead({ title, subtitle }) {
    const $head = $('<div>').addClass('page-head');
    $head.append($('<h1>').text(title));
    if (subtitle) {
      $head.append($('<p>').text(subtitle));
    }
    return $head;
  }

  FC.PageHead = PageHead;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
