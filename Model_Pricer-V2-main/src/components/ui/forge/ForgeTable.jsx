import React, { useState, useMemo, useCallback } from 'react';
import ForgePagination from './ForgePagination';
import { Skeleton } from './ForgeSkeleton';

/**
 * ForgeTable — Reusable data table with Forge Design System styling.
 *
 * Features:
 *  - Sortable columns (click header to toggle asc/desc)
 *  - Built-in pagination (configurable items per page)
 *  - Row selection with checkbox column
 *  - Row click handler
 *  - Empty state display
 *  - Loading state (skeleton rows)
 *  - Striped rows (optional)
 *  - Responsive horizontal scroll on mobile
 *
 * Props:
 *  - columns:           Array of { key, label, sortable?, align?, width?, render? }
 *  - data:              Array of row objects
 *  - rowKey:            string | (row, index) => string — unique key for each row (default: index)
 *  - onRowClick:        (row, index) => void
 *  - emptyMessage:      string | ReactNode
 *  - className:         string
 *  - striped:           boolean (default: true)
 *
 *  Sorting:
 *  - defaultSort:       { key: string, direction: 'asc' | 'desc' } — initial sort
 *  - onSortChange:      ({ key, direction }) => void — controlled sort callback
 *  - sort:              { key, direction } — controlled sort state (external)
 *
 *  Pagination:
 *  - paginated:         boolean (default: false)
 *  - pageSize:          number (default: 10)
 *  - pageSizeOptions:   number[] (default: [10, 25, 50])
 *  - paginationMode:    'full' | 'compact' (default: 'full')
 *
 *  Selection:
 *  - selectable:        boolean (default: false)
 *  - selectedRows:      Set or array of row keys
 *  - onSelectionChange: (selectedKeys: string[]) => void
 *
 *  Loading:
 *  - loading:           boolean (default: false)
 *  - loadingRows:       number (default: 5) — skeleton rows to show while loading
 */
export default function ForgeTable({
  columns = [],
  data = [],
  rowKey,
  onRowClick,
  emptyMessage = 'No data available.',
  className = '',
  striped = true,

  // Sorting
  defaultSort = null,
  sort: controlledSort,
  onSortChange,

  // Pagination
  paginated = false,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  paginationMode = 'full',

  // Selection
  selectable = false,
  selectedRows: controlledSelected,
  onSelectionChange,

  // Loading
  loading = false,
  loadingRows = 5,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [internalSort, setInternalSort] = useState(defaultSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalSelected, setInternalSelected] = useState(new Set());

  // -- Sort state (controlled or internal) --
  const activeSort = controlledSort || internalSort;

  const handleSortClick = useCallback((col) => {
    if (!col.sortable) return;
    const newDirection =
      activeSort?.key === col.key && activeSort?.direction === 'asc'
        ? 'desc'
        : 'asc';
    const newSort = { key: col.key, direction: newDirection };
    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setInternalSort(newSort);
    }
    // Reset to first page when sort changes
    setCurrentPage(1);
  }, [activeSort, onSortChange]);

  // -- Selection state (controlled or internal) --
  const selectedSet = useMemo(() => {
    if (controlledSelected) {
      return controlledSelected instanceof Set
        ? controlledSelected
        : new Set(controlledSelected);
    }
    return internalSelected;
  }, [controlledSelected, internalSelected]);

  const getRowKey = useCallback((row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string') return String(row[rowKey]);
    return String(index);
  }, [rowKey]);

  const updateSelection = useCallback((newSet) => {
    const arr = Array.from(newSet);
    if (onSelectionChange) {
      onSelectionChange(arr);
    } else {
      setInternalSelected(newSet);
    }
  }, [onSelectionChange]);

  const handleRowSelect = useCallback((key, e) => {
    e.stopPropagation();
    const next = new Set(selectedSet);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    updateSelection(next);
  }, [selectedSet, updateSelection]);

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedSet.size === displayData.length && displayData.length > 0) {
      updateSelection(new Set());
    } else {
      const allKeys = new Set(displayData.map((row, i) => getRowKey(row, i)));
      updateSelection(allKeys);
    }
  };

  // -- Sort data --
  const sortedData = useMemo(() => {
    if (!activeSort || !activeSort.key) return data;
    const { key, direction } = activeSort;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      // Handle nulls/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, activeSort]);

  // -- Paginate data --
  const displayData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, paginated, currentPage, pageSize]);

  // Reset page if data shrinks
  useMemo(() => {
    if (paginated) {
      const maxPage = Math.max(1, Math.ceil(sortedData.length / pageSize));
      if (currentPage > maxPage) setCurrentPage(maxPage);
    }
  }, [sortedData.length, pageSize, paginated, currentPage]);

  // -- Styles --
  const wrapperStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    overflow: 'hidden',
    width: '100%',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
  };

  const headerRowStyle = {
    backgroundColor: 'var(--forge-bg-elevated)',
    borderBottom: '1px solid var(--forge-border-default)',
  };

  const headerCellStyle = (col) => ({
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: activeSort?.key === col.key
      ? 'var(--forge-accent-primary)'
      : 'var(--forge-text-muted)',
    padding: '12px 16px',
    textAlign: col.align || 'left',
    width: col.width || 'auto',
    whiteSpace: 'nowrap',
    cursor: col.sortable ? 'pointer' : 'default',
    userSelect: col.sortable ? 'none' : 'auto',
    transition: 'color var(--forge-duration-micro) ease',
  });

  const bodyCellStyle = (col) => ({
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
    color: 'var(--forge-text-secondary)',
    padding: '12px 16px',
    textAlign: col.align || 'left',
    borderTop: '1px solid var(--forge-border-grid)',
  });

  const getRowStyle = (index, isSelected) => {
    const isHovered = hoveredRow === index;
    let bg;
    if (isSelected) {
      bg = 'var(--forge-accent-primary-ghost)';
    } else if (isHovered) {
      bg = 'var(--forge-bg-elevated)';
    } else if (striped && index % 2 !== 0) {
      bg = 'var(--forge-bg-void)';
    } else {
      bg = 'var(--forge-bg-surface)';
    }
    return {
      backgroundColor: bg,
      transition: 'background-color 120ms ease',
      cursor: onRowClick ? 'pointer' : 'default',
    };
  };

  const emptyStyle = {
    textAlign: 'center',
    padding: '48px 16px',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
  };

  const scrollWrapperStyle = {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  };

  const checkboxCellStyle = {
    width: '44px',
    padding: '12px 8px 12px 16px',
    textAlign: 'center',
  };

  const checkboxStyle = (checked) => ({
    width: '16px',
    height: '16px',
    borderRadius: 'var(--forge-radius-sm)',
    border: checked
      ? '2px solid var(--forge-accent-primary)'
      : '2px solid var(--forge-border-active)',
    backgroundColor: checked
      ? 'var(--forge-accent-primary)'
      : 'transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--forge-duration-micro) ease',
    flexShrink: 0,
  });

  const sortArrowStyle = (direction) => ({
    display: 'inline-block',
    marginLeft: '4px',
    fontSize: '10px',
    color: 'var(--forge-accent-primary)',
    verticalAlign: 'middle',
  });

  const paginationBarStyle = {
    padding: '12px 16px',
    borderTop: '1px solid var(--forge-border-default)',
    backgroundColor: 'var(--forge-bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const pageSizeSelectStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '11px',
    color: 'var(--forge-text-secondary)',
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    padding: '4px 8px',
    cursor: 'pointer',
    outline: 'none',
  };

  // -- Sort indicator --
  const renderSortArrow = (col) => {
    if (!col.sortable) return null;
    if (activeSort?.key !== col.key) {
      // Show faint unsorted indicator
      return (
        <span style={{ ...sortArrowStyle(), color: 'var(--forge-text-disabled)', opacity: 0.5 }}>
          &#8597;
        </span>
      );
    }
    return (
      <span style={sortArrowStyle(activeSort.direction)}>
        {activeSort.direction === 'asc' ? '\u2191' : '\u2193'}
      </span>
    );
  };

  // -- Checkmark SVG --
  const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display: 'block' }}>
      <path d="M2 5L4.5 7.5L8 3" stroke="#08090C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // -- Loading skeleton rows --
  if (loading) {
    const colCount = (selectable ? 1 : 0) + columns.length;
    return (
      <div className={className} style={wrapperStyle}>
        <div style={scrollWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={headerRowStyle}>
                {selectable && (
                  <th style={{ ...checkboxCellStyle, ...headerCellStyle({ align: 'center' }) }}>
                    <div style={checkboxStyle(false)} />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} style={headerCellStyle(col)}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: loadingRows }, (_, rowIdx) => (
                <tr key={rowIdx} style={getRowStyle(rowIdx, false)}>
                  {selectable && (
                    <td style={checkboxCellStyle}>
                      <Skeleton width="16px" height="16px" borderRadius="var(--forge-radius-sm)" />
                    </td>
                  )}
                  {columns.map((col, colIdx) => (
                    <td key={col.key} style={bodyCellStyle(col)}>
                      <Skeleton
                        width={`${55 + ((colIdx * 17 + rowIdx * 13) % 40)}%`}
                        height="14px"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // -- Determine if all visible rows are selected --
  const allSelected = displayData.length > 0 &&
    displayData.every((row, i) => selectedSet.has(getRowKey(row, i)));
  const someSelected = displayData.some((row, i) => selectedSet.has(getRowKey(row, i)));

  return (
    <div className={className} style={wrapperStyle}>
      <div style={scrollWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              {selectable && (
                <th style={{ ...checkboxCellStyle, borderBottom: 'none' }}>
                  <div
                    role="checkbox"
                    tabIndex={0}
                    aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
                    aria-label="Select all rows"
                    style={checkboxStyle(allSelected)}
                    onClick={handleSelectAll}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectAll(e); } }}
                  >
                    {allSelected && <CheckIcon />}
                    {!allSelected && someSelected && (
                      <span style={{ color: '#08090C', fontSize: '12px', lineHeight: 1, fontWeight: 700 }}>&minus;</span>
                    )}
                  </div>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={headerCellStyle(col)}
                  onClick={() => handleSortClick(col)}
                  role={col.sortable ? 'button' : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  aria-sort={
                    activeSort?.key === col.key
                      ? activeSort.direction === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSortClick(col);
                    }
                  }}
                >
                  {col.label}
                  {renderSortArrow(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={(selectable ? 1 : 0) + columns.length}
                  style={emptyStyle}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const key = getRowKey(row, rowIndex);
                const isSelected = selectedSet.has(key);
                return (
                  <tr
                    key={key}
                    style={getRowStyle(rowIndex, isSelected)}
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => onRowClick && onRowClick(row, rowIndex)}
                  >
                    {selectable && (
                      <td style={checkboxCellStyle}>
                        <div
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={isSelected}
                          aria-label={`Select row ${rowIndex + 1}`}
                          style={checkboxStyle(isSelected)}
                          onClick={(e) => handleRowSelect(key, e)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRowSelect(key, e);
                            }
                          }}
                        >
                          {isSelected && <CheckIcon />}
                        </div>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} style={bodyCellStyle(col)}>
                        {col.render
                          ? col.render(row[col.key], row, rowIndex)
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      {paginated && sortedData.length > 0 && (
        <div style={paginationBarStyle}>
          {pageSizeOptions.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--forge-font-tech)', fontSize: '11px', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rows
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={pageSizeSelectStyle}
                aria-label="Rows per page"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
          <ForgePagination
            total={sortedData.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onChange={setCurrentPage}
            mode={paginationMode}
          />
        </div>
      )}
    </div>
  );
}
