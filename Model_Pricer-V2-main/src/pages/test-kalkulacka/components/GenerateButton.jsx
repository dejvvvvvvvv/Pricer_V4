import React from 'react';
import styles from './GenerateButton.module.css';

const ICON_SIZES = {
  default: 24,
  top: 20,
  compact: 18,
};

/**
 * Fancy CTA button (Uiverse style) used for slicing actions.
 *
 * size:
 *  - default: hero button
 *  - top: ~20% smaller (header controls)
 *  - compact: ~35% smaller (metrics card)
 */
const GenerateButton = ({
  label = 'Spočítat cenu',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  size = 'default',
  ...rest
}) => {
  const iconSize = ICON_SIZES[size] || ICON_SIZES.default;
  const sizeClass =
    size === 'top' ? styles.sizeTop :
    size === 'compact' ? styles.sizeCompact :
    '';

  return (
    <button
      type="button"
      className={`${styles.btn} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : 'false'}
      {...rest}
    >
      <svg
        height={iconSize}
        width={iconSize}
        viewBox="0 0 24 24"
        data-name="Layer 1"
        id="Layer_1"
        className={styles.sparkle}
        aria-hidden="true"
      >
        <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z" />
      </svg>
      <span className={styles.text}>{loading ? 'Počítám…' : label}</span>
    </button>
  );
};

export default GenerateButton;
