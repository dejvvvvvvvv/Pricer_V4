/**
 * PropertyEditorFactory -- renders the correct editor component based on
 * a block's editable property type.
 *
 * This is the single dispatch point used by StyleTab to render property
 * editors. Every property type defined in block definitions is handled
 * here, falling back to TextPropertyEditor for unknown types.
 *
 * Supported types:
 *   color, number, text, boolean, select, spacing, font, border,
 *   shadow, alignment, opacity, background
 */
import React, { memo, useCallback } from 'react';

import ColorPropertyEditor from './ColorPropertyEditor';
import NumberPropertyEditor from './NumberPropertyEditor';
import TextPropertyEditor from './TextPropertyEditor';
import BooleanPropertyEditor from './BooleanPropertyEditor';
import SelectPropertyEditor from './SelectPropertyEditor';
import SpacingEditor from './SpacingEditor';
import FontEditor from './FontEditor';
import BorderEditor from './BorderEditor';
import ShadowEditor from './ShadowEditor';
import AlignmentEditor from './AlignmentEditor';
import OpacityEditor from './OpacityEditor';
import BackgroundEditor from './BackgroundEditor';

function PropertyEditorFactory({ property, value, onChange, onReset }) {
  const {
    key,
    label,
    labelCs,
    type,
    group,
  } = property;

  const defaultVal = property.default;

  const handleReset = useCallback(() => {
    if (onReset) onReset(key);
  }, [onReset, key]);

  switch (type) {
    case 'color':
      return (
        <ColorPropertyEditor
          label={label}
          labelCs={labelCs}
          value={value ?? defaultVal ?? '#000000'}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
        />
      );

    case 'number':
      return (
        <NumberPropertyEditor
          label={label}
          labelCs={labelCs}
          value={value ?? defaultVal ?? 0}
          min={property.min ?? 0}
          max={property.max ?? 100}
          step={property.step ?? 1}
          unit={property.unit || 'px'}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
        />
      );

    case 'text':
      return (
        <TextPropertyEditor
          label={label}
          labelCs={labelCs}
          value={value ?? defaultVal ?? ''}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
          multiline={
            key.includes('description') ||
            key.includes('Description') ||
            key.includes('tagline') ||
            key.includes('Tagline') ||
            key.includes('content') ||
            key.includes('Content')
          }
          placeholder={property.placeholder || `Enter ${label.toLowerCase()}...`}
        />
      );

    case 'boolean':
      return (
        <BooleanPropertyEditor
          label={label}
          labelCs={labelCs}
          value={value !== undefined ? Boolean(value) : Boolean(defaultVal)}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
        />
      );

    case 'select':
      return (
        <SelectPropertyEditor
          label={label}
          labelCs={labelCs}
          value={value ?? defaultVal ?? ''}
          options={property.options || []}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
        />
      );

    case 'spacing':
      return (
        <SpacingEditor
          label={label}
          labelCs={labelCs}
          marginValues={
            key === 'margin' || key.includes('margin') || key.includes('Margin')
              ? (value ?? defaultVal ?? { top: 0, right: 0, bottom: 0, left: 0 })
              : { top: 0, right: 0, bottom: 0, left: 0 }
          }
          paddingValues={
            key === 'padding' || key.includes('padding') || key.includes('Padding')
              ? (value ?? defaultVal ?? { top: 0, right: 0, bottom: 0, left: 0 })
              : { top: 0, right: 0, bottom: 0, left: 0 }
          }
          onMarginChange={(val) => onChange(key, val)}
          onPaddingChange={(val) => onChange(key, val)}
          defaultMargin={
            key === 'margin' || key.includes('margin')
              ? defaultVal
              : undefined
          }
          defaultPadding={
            key === 'padding' || key.includes('padding')
              ? defaultVal
              : undefined
          }
        />
      );

    case 'font':
      return (
        <FontEditor
          label={label}
          labelCs={labelCs}
          fontFamily={value ?? defaultVal ?? 'inherit'}
          onChange={(field, val) => onChange(`${key}_${field}`, val)}
          defaultValue={defaultVal ? { fontFamily: defaultVal } : undefined}
        />
      );

    case 'border':
      return (
        <BorderEditor
          label={label}
          labelCs={labelCs}
          borderWidth={value?.borderWidth ?? defaultVal?.borderWidth ?? 0}
          borderStyle={value?.borderStyle ?? defaultVal?.borderStyle ?? 'none'}
          borderColor={value?.borderColor ?? defaultVal?.borderColor ?? '#000000'}
          borderRadius={value?.borderRadius ?? defaultVal?.borderRadius ?? 0}
          onChange={(field, val) => onChange(`${key}_${field}`, val)}
          defaultValue={defaultVal}
        />
      );

    case 'shadow':
      return (
        <ShadowEditor
          label={label}
          labelCs={labelCs}
          value={Array.isArray(value) ? value : []}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
        />
      );

    case 'alignment':
      return (
        <AlignmentEditor
          label={label}
          labelCs={labelCs}
          value={value ?? defaultVal ?? 'left'}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal}
        />
      );

    case 'opacity':
      return (
        <OpacityEditor
          label={label}
          labelCs={labelCs}
          value={value ?? defaultVal ?? 1}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal ?? 1}
        />
      );

    case 'background':
      return (
        <BackgroundEditor
          label={label}
          labelCs={labelCs}
          bgColor={value?.bgColor ?? defaultVal?.bgColor ?? '#FFFFFF'}
          bgImage={value?.bgImage ?? defaultVal?.bgImage ?? ''}
          bgSize={value?.bgSize ?? defaultVal?.bgSize ?? 'cover'}
          bgPosition={value?.bgPosition ?? defaultVal?.bgPosition ?? 'center'}
          bgRepeat={value?.bgRepeat ?? defaultVal?.bgRepeat ?? false}
          gradientDirection={value?.gradientDirection ?? 'to right'}
          gradientFrom={value?.gradientFrom ?? '#3B82F6'}
          gradientTo={value?.gradientTo ?? '#8B5CF6'}
          onChange={(field, val) => onChange(`${key}_${field}`, val)}
          defaultValue={defaultVal}
        />
      );

    default:
      // Fallback: render as text input
      return (
        <TextPropertyEditor
          label={label}
          labelCs={labelCs}
          value={value != null ? String(value) : (defaultVal != null ? String(defaultVal) : '')}
          onChange={(val) => onChange(key, val)}
          defaultValue={defaultVal != null ? String(defaultVal) : undefined}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      );
  }
}

export default memo(PropertyEditorFactory);
