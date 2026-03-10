import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCSV, downloadFile, exportCSV, exportJSON } from '../exportData.js';

// ---------------------------------------------------------------------------
// Mocks for browser APIs (URL.createObjectURL, document.createElement, etc.)
// ---------------------------------------------------------------------------

let createdElements;
let revokedURLs;

beforeEach(() => {
  createdElements = [];
  revokedURLs = [];

  // Mock URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn((url) => revokedURLs.push(url));

  // Mock Blob — must use class syntax so `new Blob(...)` works
  global.Blob = vi.fn(function BlobMock(parts, options) {
    this.parts = parts;
    this.options = options;
  });

  // Mock document.createElement — return a trackable anchor element
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = { tagName: tag, click: vi.fn() };
    createdElements.push(el);
    return el;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// toCSV
// ===========================================================================

describe('toCSV', () => {
  it('should convert an array of objects to a CSV string', () => {
    // Arrange
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];

    // Act
    const result = toCSV(data);

    // Assert
    expect(result).toBe('name,age\nAlice,30\nBob,25');
  });

  it('should include a header row from object keys', () => {
    // Arrange
    const data = [{ firstName: 'Jan', lastName: 'Novak' }];

    // Act
    const result = toCSV(data);
    const headerLine = result.split('\n')[0];

    // Assert
    expect(headerLine).toBe('firstName,lastName');
  });

  it('should use custom columns parameter for headers and key selection', () => {
    // Arrange
    const data = [
      { id: 1, name: 'Widget', price: 100, internal: 'secret' },
    ];
    const columns = [
      { key: 'name', label: 'Product Name' },
      { key: 'price', label: 'Price (CZK)' },
    ];

    // Act
    const result = toCSV(data, columns);

    // Assert — only selected columns, with custom labels
    // "Product Name" has no special chars so not quoted; headers use escapeCSVField
    expect(result).toBe('Product Name,Price (CZK)\nWidget,100');
  });

  it('should return an empty string for an empty array', () => {
    // Arrange & Act
    const result = toCSV([]);

    // Assert
    expect(result).toBe('');
  });

  it('should return an empty string for null/undefined input', () => {
    expect(toCSV(null)).toBe('');
    expect(toCSV(undefined)).toBe('');
  });

  it('should escape commas in values by wrapping in double quotes', () => {
    // Arrange
    const data = [{ description: 'Red, Green, Blue' }];

    // Act
    const result = toCSV(data);

    // Assert
    expect(result).toBe('description\n"Red, Green, Blue"');
  });

  it('should escape double quotes in values by doubling them', () => {
    // Arrange
    const data = [{ note: 'He said "hello"' }];

    // Act
    const result = toCSV(data);

    // Assert
    expect(result).toBe('note\n"He said ""hello"""');
  });

  it('should handle newlines in values by wrapping in double quotes', () => {
    // Arrange
    const data = [{ address: 'Line 1\nLine 2' }];

    // Act
    const result = toCSV(data);

    // Assert
    expect(result).toBe('address\n"Line 1\nLine 2"');
  });

  it('should handle null and undefined values as empty strings', () => {
    // Arrange
    const data = [{ a: null, b: undefined, c: 'ok' }];

    // Act
    const result = toCSV(data);

    // Assert
    expect(result).toBe('a,b,c\n,,ok');
  });

  it('should handle numeric values without quoting', () => {
    // Arrange
    const data = [{ count: 42, price: 3.14, negative: -5 }];

    // Act
    const result = toCSV(data);

    // Assert
    expect(result).toBe('count,price,negative\n42,3.14,-5');
  });
});

// ===========================================================================
// downloadFile
// ===========================================================================

describe('downloadFile', () => {
  it('should create a Blob and trigger a download via anchor click', () => {
    // Arrange
    const content = 'test content';
    const filename = 'test.txt';
    const mimeType = 'text/plain';

    // Act
    downloadFile(content, filename, mimeType);

    // Assert — Blob created with correct content and type
    expect(global.Blob).toHaveBeenCalledWith([content], { type: mimeType });

    // Assert — anchor element configured and clicked
    expect(document.createElement).toHaveBeenCalledWith('a');
    const anchor = createdElements[0];
    expect(anchor.href).toBe('blob:mock-url');
    expect(anchor.download).toBe(filename);
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it('should clean up the object URL after triggering download', () => {
    // Arrange & Act
    downloadFile('data', 'file.csv', 'text/csv');

    // Assert
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(revokedURLs).toEqual(['blob:mock-url']);
  });
});

// ===========================================================================
// exportCSV
// ===========================================================================

describe('exportCSV', () => {
  it('should call downloadFile with CSV content and correct MIME type', () => {
    // Arrange
    const data = [{ x: 1 }];

    // Act
    exportCSV(data, 'report.csv');

    // Assert — Blob created with CSV mime type
    expect(global.Blob).toHaveBeenCalledWith(
      ['x\n1'],
      { type: 'text/csv;charset=utf-8;' }
    );

    // Assert — correct filename
    const anchor = createdElements[0];
    expect(anchor.download).toBe('report.csv');
  });

  it('should use default filename export.csv when none provided', () => {
    // Arrange
    const data = [{ a: 1 }];

    // Act
    exportCSV(data);

    // Assert
    const anchor = createdElements[0];
    expect(anchor.download).toBe('export.csv');
  });
});

// ===========================================================================
// exportJSON
// ===========================================================================

describe('exportJSON', () => {
  it('should call downloadFile with JSON content and application/json MIME type', () => {
    // Arrange
    const data = [{ id: 1, name: 'Test' }];

    // Act
    exportJSON(data, 'data.json');

    // Assert — Blob created with JSON mime type
    expect(global.Blob).toHaveBeenCalledWith(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    );

    // Assert — correct filename
    const anchor = createdElements[0];
    expect(anchor.download).toBe('data.json');
  });

  it('should produce properly formatted (indented) JSON', () => {
    // Arrange
    const data = [{ key: 'value' }];

    // Act
    exportJSON(data);

    // Assert — content passed to Blob is indented JSON
    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toBe(JSON.stringify(data, null, 2));
    expect(blobContent).toContain('\n'); // indentation produces newlines
  });

  it('should use default filename export.json when none provided', () => {
    // Arrange
    const data = [{ a: 1 }];

    // Act
    exportJSON(data);

    // Assert
    const anchor = createdElements[0];
    expect(anchor.download).toBe('export.json');
  });
});
