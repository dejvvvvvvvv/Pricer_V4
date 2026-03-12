import React from 'react';

/**
 * ForgePagination — Reusable pagination component for Forge Design System.
 *
 * Props:
 *  - total:       Total number of items
 *  - pageSize:    Items per page
 *  - currentPage: Current page (1-based)
 *  - onChange:     (page: number) => void
 *  - mode:        'full' | 'compact' (default: 'full')
 *  - className:   Additional CSS class
 */
export default function ForgePagination({
  total = 0,
  pageSize = 10,
  currentPage = 1,
  onChange,
  mode = 'full',
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, currentPage), totalPages);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page && onChange) {
      onChange(newPage);
    }
  };

  // Calculate visible page numbers for full mode
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if few enough
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first page
    pages.push(1);

    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);

    // Adjust window to always show `maxVisible` pages in the middle
    if (page <= 3) {
      end = Math.min(maxVisible, totalPages - 1);
    } else if (page >= totalPages - 2) {
      start = Math.max(2, totalPages - maxVisible + 1);
    }

    if (start > 2) pages.push('ellipsis-start');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis-end');

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: mode === 'compact' ? '4px' : '6px',
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    userSelect: 'none',
  };

  const navButtonStyle = (disabled) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    borderRadius: 'var(--forge-radius-sm)',
    border: '1px solid var(--forge-border-default)',
    backgroundColor: 'transparent',
    color: disabled ? 'var(--forge-text-disabled)' : 'var(--forge-text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--forge-duration-micro) ease',
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    lineHeight: 1,
    opacity: disabled ? 0.5 : 1,
  });

  const pageButtonStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    padding: '0 6px',
    borderRadius: 'var(--forge-radius-sm)',
    border: isActive
      ? '1px solid var(--forge-accent-primary)'
      : '1px solid transparent',
    backgroundColor: isActive
      ? 'var(--forge-accent-primary-subtle)'
      : 'transparent',
    color: isActive
      ? 'var(--forge-accent-primary)'
      : 'var(--forge-text-secondary)',
    cursor: isActive ? 'default' : 'pointer',
    transition: 'all var(--forge-duration-micro) ease',
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    fontWeight: isActive ? 600 : 400,
    lineHeight: 1,
  });

  const ellipsisStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    height: '32px',
    color: 'var(--forge-text-muted)',
    fontSize: '12px',
    letterSpacing: '2px',
  };

  const infoStyle = {
    color: 'var(--forge-text-muted)',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  };

  const handleHover = (e, disabled) => {
    if (disabled) return;
    e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
    e.currentTarget.style.borderColor = 'var(--forge-border-active)';
    e.currentTarget.style.color = 'var(--forge-text-primary)';
  };

  const handleLeave = (e, disabled, isActive) => {
    if (disabled) return;
    if (isActive) {
      e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-subtle)';
      e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
      e.currentTarget.style.color = 'var(--forge-accent-primary)';
    } else {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.borderColor = 'transparent';
      e.currentTarget.style.color = 'var(--forge-text-secondary)';
    }
  };

  const handleNavLeave = (e, disabled) => {
    if (disabled) return;
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.borderColor = 'var(--forge-border-default)';
    e.currentTarget.style.color = 'var(--forge-text-secondary)';
  };

  // Item range text
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (mode === 'compact') {
    return (
      <div className={className} style={containerStyle}>
        <button
          type="button"
          style={navButtonStyle(page <= 1)}
          disabled={page <= 1}
          onClick={() => handlePageChange(page - 1)}
          onMouseEnter={(e) => handleHover(e, page <= 1)}
          onMouseLeave={(e) => handleNavLeave(e, page <= 1)}
          aria-label="Previous page"
        >
          &#8249;
        </button>
        <span style={infoStyle}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          style={navButtonStyle(page >= totalPages)}
          disabled={page >= totalPages}
          onClick={() => handlePageChange(page + 1)}
          onMouseEnter={(e) => handleHover(e, page >= totalPages)}
          onMouseLeave={(e) => handleNavLeave(e, page >= totalPages)}
          aria-label="Next page"
        >
          &#8250;
        </button>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      <span style={infoStyle}>
        {total === 0
          ? 'No items'
          : `${startItem}\u2013${endItem} of ${total}`}
      </span>

      <div style={containerStyle}>
        <button
          type="button"
          style={navButtonStyle(page <= 1)}
          disabled={page <= 1}
          onClick={() => handlePageChange(page - 1)}
          onMouseEnter={(e) => handleHover(e, page <= 1)}
          onMouseLeave={(e) => handleNavLeave(e, page <= 1)}
          aria-label="Previous page"
        >
          &#8249; Prev
        </button>

        {pageNumbers.map((p) => {
          if (typeof p === 'string') {
            return <span key={p} style={ellipsisStyle}>...</span>;
          }
          const isActive = p === page;
          return (
            <button
              key={p}
              type="button"
              style={pageButtonStyle(isActive)}
              onClick={() => handlePageChange(p)}
              onMouseEnter={(e) => { if (!isActive) handleHover(e, false); }}
              onMouseLeave={(e) => handleLeave(e, false, isActive)}
              aria-label={`Page ${p}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          style={navButtonStyle(page >= totalPages)}
          disabled={page >= totalPages}
          onClick={() => handlePageChange(page + 1)}
          onMouseEnter={(e) => handleHover(e, page >= totalPages)}
          onMouseLeave={(e) => handleNavLeave(e, page >= totalPages)}
          aria-label="Next page"
        >
          Next &#8250;
        </button>
      </div>
    </div>
  );
}
