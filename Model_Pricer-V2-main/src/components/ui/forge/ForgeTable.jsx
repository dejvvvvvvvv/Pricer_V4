import React, { useState } from 'react';

/**
 * Forge-themed data table with alternating rows, hover states,
 * and optional row click handler.
 *
 * Props:
 *  - columns: Array of { key, label, align?, width?, render? }
 *  - data: Array of row objects
 *  - onRowClick: (row, index) => void
 *  - emptyMessage: string
 *  - className: string
 */
export default function ForgeTable({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No data available.',
  className = '',
}) {
  const [hoveredRow, setHoveredRow] = useState(null);

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
    color: 'var(--forge-text-muted)',
    padding: '12px 16px',
    textAlign: col.align || 'left',
    width: col.width || 'auto',
    whiteSpace: 'nowrap',
  });

  const bodyCellStyle = (col) => ({
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
    color: 'var(--forge-text-secondary)',
    padding: '12px 16px',
    textAlign: col.align || 'left',
    borderTop: '1px solid var(--forge-border-grid)',
  });

  const getRowStyle = (index) => {
    const isHovered = hoveredRow === index;
    let bg;
    if (isHovered) {
      bg = 'var(--forge-bg-elevated)';
    } else if (index % 2 === 0) {
      bg = 'var(--forge-bg-surface)';
    } else {
      bg = 'var(--forge-bg-void)';
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

  return (
    <div className={className} style={wrapperStyle}>
      <div style={scrollWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              {columns.map((col) => (
                <th key={col.key} style={headerCellStyle(col)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={emptyStyle}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={getRowStyle(rowIndex)}
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick && onRowClick(row, rowIndex)}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={bodyCellStyle(col)}>
                      {col.render
                        ? col.render(row[col.key], row, rowIndex)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
