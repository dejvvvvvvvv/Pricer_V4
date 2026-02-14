import React from 'react';

export default function SlicerAxisGizmo() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block', margin: '0 auto' }}>
      {/* Center point */}
      <circle cx="40" cy="45" r="3" fill="#3A3F4A" />

      {/* Z axis - up (blue) */}
      <line x1="40" y1="45" x2="40" y2="12" stroke="#4DA8DA" strokeWidth="1.5" />
      <circle cx="40" cy="12" r="6" fill="#4DA8DA" fillOpacity="0.2" stroke="#4DA8DA" strokeWidth="1" />
      <text x="40" y="15" textAnchor="middle" fontSize="9" fontWeight="600" fill="#4DA8DA">Z</text>

      {/* Y axis - left-down (green) */}
      <line x1="40" y1="45" x2="14" y2="62" stroke="#00D4AA" strokeWidth="1.5" />
      <circle cx="14" cy="62" r="6" fill="#00D4AA" fillOpacity="0.2" stroke="#00D4AA" strokeWidth="1" />
      <text x="14" y="65" textAnchor="middle" fontSize="9" fontWeight="600" fill="#00D4AA">Y</text>

      {/* X axis - right (red) */}
      <line x1="40" y1="45" x2="68" y2="62" stroke="#FF4757" strokeWidth="1.5" />
      <circle cx="68" cy="62" r="6" fill="#FF4757" fillOpacity="0.2" stroke="#FF4757" strokeWidth="1" />
      <text x="68" y="65" textAnchor="middle" fontSize="9" fontWeight="600" fill="#FF4757">X</text>
    </svg>
  );
}
