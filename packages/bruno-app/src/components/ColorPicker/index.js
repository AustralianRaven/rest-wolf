import React, { useState, useRef, useEffect } from 'react';
import { rgba } from 'polished';
import StyledWrapper from './StyledWrapper';
import { IconPalette, IconCheck, IconRefresh } from '@tabler/icons';

const predefinedColors = [
  '#546de5', // Default Bruno blue
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Light blue
  '#96ceb4', // Green
  '#ffeaa7', // Yellow
  '#fd79a8', // Pink
  '#fdcb6e', // Orange
  '#6c5ce7', // Purple
  '#a29bfe', // Lavender
  '#fd79a8', // Rose
  '#00b894' // Emerald
];

const ColorPicker = ({
  value,
  onChange,
  onReset,
  label = 'Accent Color',
  disabled = false,
  showReset = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const colorPickerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current
        && !dropdownRef.current.contains(event.target)
        && !colorPickerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handlePredefinedColorSelect = (color) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (event) => {
    const color = event.target.value;
    setCustomColor(color);
    onChange(color);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setIsOpen(false);
  };

  const isValidColor = (color) => {
    const style = new Option().style;
    style.color = color;
    return style.color !== '';
  };

  return (
    <StyledWrapper>
      <div className="color-picker-container">
        <div className="color-picker-label">{label}</div>
        <div className="color-picker-wrapper">
          <button
            ref={colorPickerRef}
            className={`color-picker-trigger ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            aria-label={`${label} - Current color: ${value}`}
          >
            <div
              className="color-preview"
              style={{ backgroundColor: value }}
            />
            <IconPalette size={14} strokeWidth={1.5} />
          </button>

          {isOpen && (
            <div ref={dropdownRef} className="color-picker-dropdown">
              <div className="color-section">
                <div className="section-title">Predefined Colors</div>
                <div className="predefined-colors">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${value === color ? 'selected' : ''}`}
                      onClick={() => handlePredefinedColorSelect(color)}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {value === color && (
                        <IconCheck size={12} strokeWidth={2} color="white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="color-section">
                <div className="section-title">Custom Color</div>
                <div className="custom-color-input">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="color-input"
                    aria-label="Custom color picker"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setCustomColor(color);
                      if (isValidColor(color)) {
                        onChange(color);
                      }
                    }}
                    placeholder="#546de5"
                    className="color-text-input"
                    aria-label="Custom color hex value"
                  />
                </div>
              </div>

              {showReset && (
                <div className="color-section">
                  <button
                    className="reset-button"
                    onClick={handleReset}
                    aria-label="Reset to default color"
                  >
                    <IconRefresh size={14} strokeWidth={1.5} />
                    Reset to Default
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default ColorPicker;
