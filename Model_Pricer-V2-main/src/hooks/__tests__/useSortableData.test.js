import { describe, it, expect } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useSortableData } from '../useSortableData.js';

/**
 * Minimal renderHook using React 19 createRoot API directly,
 * bypassing @testing-library/react v11 which is incompatible with React 19.
 */
function renderHook(hookFn, options = {}) {
  let result = { current: undefined };
  let currentProps = options.initialProps;

  function TestComponent({ hookProps }) {
    result.current = hookFn(hookProps);
    return null;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(TestComponent, { hookProps: currentProps }));
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      document.body.removeChild(container);
    },
    rerender: (newProps) => {
      currentProps = newProps;
      act(() => {
        root.render(React.createElement(TestComponent, { hookProps: newProps }));
      });
    },
  };
}

// --- Test Data ---

const SAMPLE_DATA = [
  { name: 'Charlie', age: 30, joined: '2024-03-15' },
  { name: 'Alice', age: 25, joined: '2024-01-10' },
  { name: 'Bob', age: 35, joined: '2024-02-20' },
];

const DATA_WITH_NULLS = [
  { name: 'Alice', score: 90 },
  { name: null, score: null },
  { name: 'Charlie', score: 70 },
  { name: 'Bob', score: null },
];

// --- Tests ---

describe('useSortableData', () => {
  it('should return data unsorted when no sort config', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data }) => useSortableData(data),
      { initialProps: { data: SAMPLE_DATA } }
    );

    // Assert
    expect(result.current.sortedData).toEqual(SAMPLE_DATA);
    expect(result.current.sortConfig).toBeNull();
    expect(typeof result.current.requestSort).toBe('function');
    unmount();
  });

  it('should sort strings ascending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'name', direction: 'asc' } } }
    );

    // Assert
    const names = result.current.sortedData.map((d) => d.name);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    unmount();
  });

  it('should sort strings descending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'name', direction: 'desc' } } }
    );

    // Assert
    const names = result.current.sortedData.map((d) => d.name);
    expect(names).toEqual(['Charlie', 'Bob', 'Alice']);
    unmount();
  });

  it('should sort numbers ascending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'age', direction: 'asc' } } }
    );

    // Assert
    const ages = result.current.sortedData.map((d) => d.age);
    expect(ages).toEqual([25, 30, 35]);
    unmount();
  });

  it('should sort numbers descending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'age', direction: 'desc' } } }
    );

    // Assert
    const ages = result.current.sortedData.map((d) => d.age);
    expect(ages).toEqual([35, 30, 25]);
    unmount();
  });

  it('should sort dates ascending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'joined', direction: 'asc' } } }
    );

    // Assert — earliest date first
    const dates = result.current.sortedData.map((d) => d.joined);
    expect(dates).toEqual(['2024-01-10', '2024-02-20', '2024-03-15']);
    unmount();
  });

  it('should sort dates descending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'joined', direction: 'desc' } } }
    );

    // Assert — latest date first
    const dates = result.current.sortedData.map((d) => d.joined);
    expect(dates).toEqual(['2024-03-15', '2024-02-20', '2024-01-10']);
    unmount();
  });

  it('should push null values to end when sorting ascending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: DATA_WITH_NULLS, defaultSort: { key: 'score', direction: 'asc' } } }
    );

    // Assert — non-null values sorted first, nulls at end
    const scores = result.current.sortedData.map((d) => d.score);
    expect(scores).toEqual([70, 90, null, null]);
    unmount();
  });

  it('should push null values to end when sorting descending', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: DATA_WITH_NULLS, defaultSort: { key: 'score', direction: 'desc' } } }
    );

    // Assert — non-null values sorted desc first, nulls at end
    const scores = result.current.sortedData.map((d) => d.score);
    expect(scores).toEqual([90, 70, null, null]);
    unmount();
  });

  it('should push null string values to end', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: DATA_WITH_NULLS, defaultSort: { key: 'name', direction: 'asc' } } }
    );

    // Assert — non-null names sorted, null at end
    const names = result.current.sortedData.map((d) => d.name);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie', null]);
    unmount();
  });

  it('should toggle: first click = asc, second = desc, third = clear', () => {
    // Arrange
    const { result, unmount } = renderHook(
      ({ data }) => useSortableData(data),
      { initialProps: { data: SAMPLE_DATA } }
    );

    // Act — first click: asc
    act(() => {
      result.current.requestSort('name');
    });

    // Assert
    expect(result.current.sortConfig).toEqual({ key: 'name', direction: 'asc' });
    let names = result.current.sortedData.map((d) => d.name);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie']);

    // Act — second click: desc
    act(() => {
      result.current.requestSort('name');
    });

    // Assert
    expect(result.current.sortConfig).toEqual({ key: 'name', direction: 'desc' });
    names = result.current.sortedData.map((d) => d.name);
    expect(names).toEqual(['Charlie', 'Bob', 'Alice']);

    // Act — third click: clear
    act(() => {
      result.current.requestSort('name');
    });

    // Assert
    expect(result.current.sortConfig).toBeNull();
    expect(result.current.sortedData).toEqual(SAMPLE_DATA);
    unmount();
  });

  it('should reset to asc when sorting a different column', () => {
    // Arrange
    const { result, unmount } = renderHook(
      ({ data }) => useSortableData(data),
      { initialProps: { data: SAMPLE_DATA } }
    );

    // Act — sort by name asc, then desc
    act(() => {
      result.current.requestSort('name');
    });
    act(() => {
      result.current.requestSort('name');
    });
    expect(result.current.sortConfig).toEqual({ key: 'name', direction: 'desc' });

    // Act — switch to age column
    act(() => {
      result.current.requestSort('age');
    });

    // Assert — resets to asc for the new column
    expect(result.current.sortConfig).toEqual({ key: 'age', direction: 'asc' });
    const ages = result.current.sortedData.map((d) => d.age);
    expect(ages).toEqual([25, 30, 35]);
    unmount();
  });

  it('should return empty array for empty data', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data }) => useSortableData(data),
      { initialProps: { data: [] } }
    );

    // Assert
    expect(result.current.sortedData).toEqual([]);
    unmount();
  });

  it('should return empty array for null data', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data }) => useSortableData(data),
      { initialProps: { data: null } }
    );

    // Assert
    expect(result.current.sortedData).toEqual([]);
    unmount();
  });

  it('should return empty array for undefined data', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(
      ({ data }) => useSortableData(data),
      { initialProps: { data: undefined } }
    );

    // Assert
    expect(result.current.sortedData).toEqual([]);
    unmount();
  });

  it('should sort strings case-insensitively', () => {
    // Arrange
    const mixedCaseData = [
      { name: 'charlie' },
      { name: 'Alice' },
      { name: 'BOB' },
    ];

    // Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: mixedCaseData, defaultSort: { key: 'name', direction: 'asc' } } }
    );

    // Assert
    const names = result.current.sortedData.map((d) => d.name);
    expect(names).toEqual(['Alice', 'BOB', 'charlie']);
    unmount();
  });

  it('should apply default sort config on initial render', () => {
    // Arrange
    const defaultSort = { key: 'age', direction: 'desc' };

    // Act
    const { result, unmount } = renderHook(
      ({ data, ds }) => useSortableData(data, ds),
      { initialProps: { data: SAMPLE_DATA, ds: defaultSort } }
    );

    // Assert
    expect(result.current.sortConfig).toEqual(defaultSort);
    const ages = result.current.sortedData.map((d) => d.age);
    expect(ages).toEqual([35, 30, 25]);
    unmount();
  });

  it('should not mutate the original data array', () => {
    // Arrange
    const originalData = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ];
    const dataCopy = [...originalData];

    // Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: originalData, defaultSort: { key: 'name', direction: 'asc' } } }
    );

    // Assert — sorted result is different order
    expect(result.current.sortedData[0].name).toBe('Alice');
    // Original array unchanged
    expect(originalData).toEqual(dataCopy);
    unmount();
  });

  it('should handle data with equal values correctly', () => {
    // Arrange
    const dataWithDuplicates = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 30 },
      { name: 'Charlie', age: 30 },
    ];

    // Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: dataWithDuplicates, defaultSort: { key: 'age', direction: 'asc' } } }
    );

    // Assert — all ages equal, length preserved
    expect(result.current.sortedData).toHaveLength(3);
    expect(result.current.sortedData.every((d) => d.age === 30)).toBe(true);
    unmount();
  });

  it('should handle both null values returning 0 (equal)', () => {
    // Arrange
    const bothNullData = [
      { name: 'Alice', score: null },
      { name: 'Bob', score: null },
    ];

    // Act
    const { result, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: bothNullData, defaultSort: { key: 'score', direction: 'asc' } } }
    );

    // Assert — both null, order preserved (stable sort)
    expect(result.current.sortedData).toHaveLength(2);
    unmount();
  });

  it('should update sorted data when data prop changes', () => {
    // Arrange
    const { result, rerender, unmount } = renderHook(
      ({ data, defaultSort }) => useSortableData(data, defaultSort),
      { initialProps: { data: SAMPLE_DATA, defaultSort: { key: 'name', direction: 'asc' } } }
    );
    expect(result.current.sortedData[0].name).toBe('Alice');

    // Act — add a new item that sorts first
    const newData = [...SAMPLE_DATA, { name: 'Aaron', age: 22, joined: '2024-04-01' }];
    rerender({ data: newData, defaultSort: { key: 'name', direction: 'asc' } });

    // Assert
    expect(result.current.sortedData[0].name).toBe('Aaron');
    expect(result.current.sortedData).toHaveLength(4);
    unmount();
  });
});
