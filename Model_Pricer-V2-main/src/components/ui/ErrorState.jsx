/*
  ErrorState — error display for failed async queries.
  Provides retry capability and human-readable error messages.
*/

import React from 'react';

/**
 * @param {Object} props
 * @param {Error|string} props.error - The error object or message
 * @param {Function} props.onRetry - Retry callback
 * @param {string} props.title - Custom error title
 * @param {string} props.className - Additional CSS classes
 * @param {'inline' | 'card' | 'fullPage'} props.variant - Visual style
 * @param {boolean} props.showDetails - Show technical error details
 */
export function ErrorState({
  error,
  onRetry,
  title,
  className = '',
  variant = 'card',
  showDetails = false,
}) {
  const message = typeof error === 'string'
    ? error
    : error?.message || 'An unexpected error occurred';

  const isNetworkError = message.includes('fetch') ||
    message.includes('network') ||
    message.includes('CORS') ||
    message.includes('Failed to fetch');

  const defaultTitle = isNetworkError
    ? 'Connection error'
    : 'Something went wrong';

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-600 text-sm ${className}`}>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-blue-600 hover:text-blue-800 underline text-xs ml-1"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (variant === 'fullPage') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] ${className}`}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title || defaultTitle}
        </h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-md">{message}</p>
        {showDetails && error?.stack && (
          <pre className="text-xs text-gray-400 bg-gray-50 p-3 rounded max-w-lg overflow-auto mb-4">
            {error.stack}
          </pre>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Default: card
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">
            {title || defaultTitle}
          </h4>
          <p className="text-sm text-red-600 mt-1">{message}</p>
          {showDetails && error?.stack && (
            <pre className="text-xs text-red-400 mt-2 overflow-auto max-h-32">
              {error.stack}
            </pre>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 text-sm text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
