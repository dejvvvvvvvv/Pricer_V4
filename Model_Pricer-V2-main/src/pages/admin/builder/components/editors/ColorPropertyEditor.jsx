/**
 * ColorPropertyEditor -- color swatch + advanced color picker.
 *
 * Delegates to BuilderColorPicker (react-colorful based) for the
 * actual color selection UI. This editor is a thin wrapper that adds
 * the label and integrates into the property editor list.
 */
import React from 'react';

import BuilderColorPicker from '../BuilderColorPicker';

export default function ColorPropertyEditor({ label, value, onChange }) {
  return (
    <BuilderColorPicker
      value={value || '#000000'}
      onChange={onChange}
      label={label}
    />
  );
}
