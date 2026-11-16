import React from 'react';
import {
  createSeededAvatar,
  sanitizeAvatarConfig,
  type AvatarAccessory,
  type AvatarConfig,
  type AvatarEyes,
  type AvatarMouth,
  type AvatarShape,
} from '../../shared/gameData';

interface ProceduralAvatarProps {
  avatar?: AvatarConfig;
  color?: string;
  name?: string;
  className?: string;
  title?: string;
}

function renderShapePath(shape: AvatarShape): string {
  switch (shape) {
    case 'circle':
      return 'M32 14 A20 20 0 1 1 31.99 14 Z';
    case 'rounded':
      return 'M22 14 H42 A10 10 0 0 1 52 24 V44 A10 10 0 0 1 42 54 H22 A10 10 0 0 1 12 44 V24 A10 10 0 0 1 22 14 Z';
    case 'blob':
      return 'M32 13 C43 13 51 18 52 28 C53 38 49 52 36 54 C24 56 12 49 12 36 C12 24 19 13 32 13 Z';
    case 'hexagon':
      return 'M32 13 L50 23 V44 L32 54 L14 44 V23 Z';
    case 'star':
      return 'M32 11 L38 19 L49 17 L47 28 L55 34 L47 40 L49 51 L38 49 L32 56 L26 49 L15 51 L17 40 L9 34 L17 28 L15 17 L26 19 Z';
    case 'diamond':
      return 'M32 11 L54 34 L32 56 L10 34 Z';
  }
}

function renderEyes(eyes: AvatarEyes) {
  switch (eyes) {
    case 'classic':
      return (
        <g fill="#14171F">
          <circle cx="25" cy="32" r="2.6" />
          <circle cx="39" cy="32" r="2.6" />
          <circle cx="25.8" cy="31" r="0.8" fill="#FCFBF7" />
          <circle cx="39.8" cy="31" r="0.8" fill="#FCFBF7" />
        </g>
      );
    case 'happy':
      return (
        <g fill="none" stroke="#14171F" strokeWidth="2.6" strokeLinecap="round">
          <path d="M21.5 33 Q25 28.5 28.5 33" />
          <path d="M35.5 33 Q39 28.5 42.5 33" />
        </g>
      );
    case 'wink':
      return (
        <g>
          <circle cx="25" cy="32" r="2.6" fill="#14171F" />
          <circle cx="25.8" cy="31" r="0.8" fill="#FCFBF7" />
          <path
            d="M35.5 32.5 Q39 29 42.5 32.5"
            fill="none"
            stroke="#14171F"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>
      );
    case 'cool':
      return (
        <g>
          <rect x="19" y="28.5" width="11" height="6.5" rx="2.5" fill="#14171F" />
          <rect x="34" y="28.5" width="11" height="6.5" rx="2.5" fill="#14171F" />
          <path d="M30 31.2 H34" stroke="#14171F" strokeWidth="2.2" />
          <path d="M21 30.5 L24 30.5" stroke="#FCFBF7" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          <path d="M36 30.5 L39 30.5" stroke="#FCFBF7" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case 'wide':
      return (
        <g>
          <circle cx="25" cy="32" r="4.1" fill="#FCFBF7" stroke="#14171F" strokeWidth="1.8" />
          <circle cx="39" cy="32" r="4.1" fill="#FCFBF7" stroke="#14171F" strokeWidth="1.8" />
          <circle cx="25.5" cy="32" r="1.8" fill="#14171F" />
          <circle cx="39.5" cy="32" r="1.8" fill="#14171F" />
        </g>
      );
  }
}

function renderMouth(mouth: AvatarMouth) {
  switch (mouth) {
    case 'smile':
      return (
        <path
          d="M26.5 40 Q32 45 37.5 40"
          fill="none"
          stroke="#14171F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    case 'grin':
      return (
        <path
          d="M24.5 39 Q32 46.5 39.5 39 Z"
          fill="#FCFBF7"
          stroke="#14171F"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      );
    case 'cat':
      return (
        <path
          d="M25.5 40 Q28.8 43.2 32 39.8 Q35.2 43.2 38.5 40"
          fill="none"
          stroke="#14171F"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'surprised':
      return (
        <ellipse
          cx="32"
          cy="41.5"
          rx="3"
          ry="3.6"
          fill="#14171F"
        />
      );
    case 'smirk':
      return (
        <path
          d="M27 41.5 Q33 43 38 38.5"
          fill="none"
          stroke="#14171F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
  }
}

function renderAccessory(accessory: AvatarAccessory) {
  switch (accessory) {
    case 'none':
      return null;
    case 'glasses':
      return (
        <g fill="none" stroke="#FCFBF7" strokeWidth="2.2">
          <circle cx="25" cy="32" r="5.6" fill="rgba(255,255,255,0.16)" />
          <circle cx="39" cy="32" r="5.6" fill="rgba(255,255,255,0.16)" />
          <path d="M30.6 32 H33.4" strokeLinecap="round" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path
            d="M21 15 L23 6 L28.5 11 L32 4.5 L35.5 11 L41 6 L43 15 Z"
            fill="#FBBF24"
            stroke="#14171F"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="11.5" r="1.4" fill="#FF5A36" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path
            d="M12.5 32 C12.5 16 51.5 16 51.5 32"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <rect x="8.5" y="27" width="6" height="12" rx="3" fill="#1E293B" stroke="#E2E8F0" strokeWidth="1.6" />
          <rect x="49.5" y="27" width="6" height="12" rx="3" fill="#1E293B" stroke="#E2E8F0" strokeWidth="1.6" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path
            d="M17 20 C19 10 45 10 47 20 Z"
            fill="#1E293B"
            stroke="#14171F"
            strokeWidth="2"
          />
          <path
            d="M16 19.5 H52 C52 22 46 23 40 22 H16 Z"
            fill="#FCFBF7"
            stroke="#14171F"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'antenna':
      return (
        <g>
          <path d="M32 14 V6.5" stroke="#E2E8F0" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="32" cy="5" r="3.4" fill="#FBBF24" stroke="#14171F" strokeWidth="1.8" />
        </g>
      );
  }
}

export const ProceduralAvatar: React.FC<ProceduralAvatarProps> = ({
  avatar,
  color,
  name = 'Player',
  className = 'w-9 h-9',
  title,
}) => {
  const resolved: AvatarConfig = avatar
    ? sanitizeAvatarConfig(avatar, color)
    : createSeededAvatar(name, color);

  const shapePath = renderShapePath(resolved.shape);

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} shrink-0 select-none`}
      role="img"
      aria-label={title || `${name} avatar`}
    >
      {title && <title>{title}</title>}
      <path
        d={shapePath}
        fill={resolved.color}
        stroke="#14171F"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d={shapePath}
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.4"
        transform="translate(0, 1) scale(0.92)"
        style={{ transformOrigin: '32px 34px' }}
      />
      {renderEyes(resolved.eyes)}
      {renderMouth(resolved.mouth)}
      {renderAccessory(resolved.accessory)}
    </svg>
  );
};
