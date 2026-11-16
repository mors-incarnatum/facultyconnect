(function (FC, $) {
  'use strict';

  const { initials } = FC;

  function resolveAvatarSrc(src) {
    if (!src) return '';
    return src.startsWith('/avatars/') ? `./public${src}` : src;
  }

  function Avatar({ person, size = '' }) {
    const name = person?.name || '';
    const avatarSrc = resolveAvatarSrc(person?.avatar || person?.photo);
    const color = person?.color || '#2d5a48';

    const $avatar = $('<div>')
      .addClass(`avatar ${size}`.trim())
      .attr({
        'aria-hidden': 'true',
        title: name,
      })
      .css('background', avatarSrc ? 'transparent' : color);

    if (avatarSrc) {
      const $img = $('<img>')
        .addClass('avatar-img')
        .attr({
          src: avatarSrc,
          alt: name,
          loading: 'lazy',
        })
        .on('error', () => {
          $avatar.css('background', color).text(initials(name));
        });
      $avatar.append($img);
    } else {
      $avatar.text(initials(name));
    }

    return $avatar;
  }

  FC.Avatar = Avatar;
})(globalThis.FC = globalThis.FC || {}, globalThis.jQuery);
