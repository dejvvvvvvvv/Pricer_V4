import React from 'react';

export default function ForgeSquiggle({ className = '', color = 'var(--forge-accent-primary)' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M2 8.5C12 3.5 22 10 32 6.5C42 3 52 9.5 62 5.5C72 1.5 82 8 92 5C102 2 112 9 122 6C132 3 142 8.5 152 5.5C162 2.5 172 7.5 182 5C192 2.5 198 6 198 6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'url(#squiggle-roughen)' }}
      />
      <defs>
        <filter id="squiggle-roughen">
          <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
