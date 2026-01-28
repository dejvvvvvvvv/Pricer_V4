import React, { useState, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { cn } from '../../utils/cn';

// Default swatch colors for quick selection
const DEFAULT_SWATCHES = [
  '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF',
  '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#000000',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#2563EB',
];

/**
 * Color picker component with HEX input and swatch grid.
 * Uses react-colorful for the color picker.
 */
const ColorPicker = ({
  value = '#2563EB',
  onChange,
  label,
  swatches = DEFAULT_SWATCHES,
  showInput = true,
  showSwatches = true,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = useCallback(
    (newColor) => {
      if (disabled) return;
      onChange?.(newColor?.toUpperCase?.() || newColor);
    },
    [onChange, disabled]
  );

  const handleSwatchClick = useCallback(
    (color) => {
      if (disabled) return;
      handleColorChange(color);
    },
    [handleColorChange, disabled]
  );

  const displayColor = value || '#2563EB';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}

      {/* Color preview button + HEX input */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((v) => !v)}
          disabled={disabled}
          className={cn(
            'w-10 h-10 rounded-lg border-2 border-border transition-all',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
          )}
          style={{ backgroundColor: displayColor }}
          aria-label="Vybrat barvu"
        />

        {showInput && (
          <div className="flex-1">
            <HexColorInput
              color={displayColor}
              onChange={handleColorChange}
              prefixed
              disabled={disabled}
              className={cn(
                'w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono uppercase',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        )}
      </div>

      {/* Expandable color picker */}
      {isOpen && !disabled && (
        <div className="p-3 bg-card border border-border rounded-xl shadow-lg space-y-3">
          <div className="color-picker-wrapper">
            <HexColorPicker color={displayColor} onChange={handleColorChange} />
          </div>

          {/* Swatches */}
          {showSwatches && swatches.length > 0 && (
            <div className="grid grid-cols-10 gap-1">
              {swatches.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSwatchClick(color)}
                  className={cn(
                    'w-6 h-6 rounded border transition-all',
                    displayColor?.toUpperCase() === color?.toUpperCase()
                      ? 'border-primary ring-2 ring-primary/30 scale-110'
                      : 'border-border hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Vybrat ${color}`}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            Hotovo
          </button>
        </div>
      )}

      {/* Inline styles for react-colorful sizing */}
      <style>{`
        .color-picker-wrapper .react-colorful {
          width: 100%;
          height: 160px;
        }
        .color-picker-wrapper .react-colorful__saturation {
          border-radius: 8px 8px 0 0;
        }
        .color-picker-wrapper .react-colorful__hue {
          height: 16px;
          border-radius: 0 0 8px 8px;
        }
        .color-picker-wrapper .react-colorful__saturation-pointer,
        .color-picker-wrapper .react-colorful__hue-pointer {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

export default ColorPicker;
