import { useState } from 'react';
import { initials } from '../utils/format.js';

export default function Avatar({ person, size }) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = person?.name || '';
  const avatarSrc = person?.avatar || person?.photo;
  const showImage = Boolean(avatarSrc && !imgFailed);
  const color = person?.color || '#2d5a48';

  return (
    <div
      className={`avatar ${size || ''}`}
      style={{
        background: showImage ? 'transparent' : color,
      }}
      aria-hidden="true"
      title={name}
    >
      {showImage ? (
        <img
          src={avatarSrc}
          alt={name}
          className="avatar-img"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
