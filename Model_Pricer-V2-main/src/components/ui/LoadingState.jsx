/*
  LoadingState — skeleton/spinner for async data loading.
  Used across admin pages during Supabase queries.
*/

import React from 'react';

/**
 * @param {Object} props
 * @param {'spinner' | 'skeleton' | 'dots'} props.variant - Visual style
 * @param {string} props.text - Loading text
 * @param {'sm' | 'md' | 'lg'} props.size - Size
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullPage - Center in full page
 * @param {number} props.skeletonRows - Number of skeleton rows (for 'skeleton' variant)
 */
export function LoadingState({
  variant = 'spinner',
  text = '',
  size = 'md',
  className = '',
  fullPage = false,
  skeletonRows = 3,
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const wrapper = fullPage
    ? 'flex flex-col items-center justify-center min-h-[200px] w-full'
    : 'flex flex-col items-center justify-center py-8';

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 w-full ${className}`}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div
              className="bg-gray-200 rounded h-4"
              style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`${wrapper} ${className}`}>
        <div className="flex space-x-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${sizes[size]} bg-blue-500 rounded-full animate-bounce`}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`mt-3 text-gray-500 ${textSizes[size]}`}>{text}</p>
        )}
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={`${wrapper} ${className}`}>
      <div
        className={`${sizes[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && (
        <p className={`mt-3 text-gray-500 ${textSizes[size]}`}>{text}</p>
      )}
    </div>
  );
}

/**
 * Inline loading indicator (for buttons, small areas).
 */
export function InlineLoader({ size = 'sm', className = '' }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <span
      className={`inline-block ${sizes[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin ${className}`}
    />
  );
}

export default LoadingState;
