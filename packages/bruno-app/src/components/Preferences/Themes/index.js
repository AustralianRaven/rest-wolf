import React from 'react';
import { rgba } from 'polished';
import { useTheme } from 'providers/Theme';
import themes, { getLightThemes, getDarkThemes } from 'themes/index';
import { IconBrightnessUp, IconMoon, IconDeviceDesktop } from '@tabler/icons';
import ColorPicker from 'components/ColorPicker';
import StyledWrapper from './StyledWrapper';

const ThemePreview = ({ themeId, isDark }) => {
  const theme = themes[themeId] || themes[isDark ? 'dark' : 'light'];

  const bgColor = theme.background.base;
  const sidebarColor = theme.sidebar.bg;
  const lineColor = rgba(theme.brand, 0.5);

  return (
    <div className="theme-preview" style={{ background: bgColor, border: `1px solid ${lineColor}` }}>
      <div className="theme-preview-sidebar" style={{ background: sidebarColor }} />
      <div className="theme-preview-main">
        <div className="theme-preview-line" style={{ background: lineColor }} />
        <div className="theme-preview-line" style={{ background: lineColor, width: '60%' }} />
        <div className="theme-preview-line" style={{ background: lineColor, width: '70%' }} />
      </div>
    </div>
  );
};

const ThemeVariantCard = ({ theme, isSelected, onClick }) => {
  const isDark = theme.mode === 'dark';

  return (
    <div className={`theme-variant-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <ThemePreview themeId={theme.id} isDark={isDark} />
      <span className="theme-variant-name">{theme.name}</span>
    </div>
  );
};

const Themes = () => {
  const {
    storedTheme,
    setStoredTheme,
    themeVariantLight,
    setThemeVariantLight,
    themeVariantDark,
    setThemeVariantDark,
    customAccentColorLight = '#546de5',
    setCustomAccentColorLight,
    customAccentColorDark = '#546de5',
    setCustomAccentColorDark
  } = useTheme();

  const lightThemes = getLightThemes();
  const darkThemes = getDarkThemes();

  const themeModes = [
    { key: 'light', label: 'Light', icon: IconBrightnessUp },
    { key: 'dark', label: 'Dark', icon: IconMoon },
    { key: 'system', label: 'System', icon: IconDeviceDesktop }
  ];

  const handleModeChange = (mode) => {
    setStoredTheme(mode);
  };

  const handleLightColorChange = (color) => {
    if (setCustomAccentColorLight) {
      setCustomAccentColorLight(color);
    }
  };

  const handleDarkColorChange = (color) => {
    if (setCustomAccentColorDark) {
      setCustomAccentColorDark(color);
    }
  };

  const handleLightColorReset = () => {
    if (setCustomAccentColorLight) {
      setCustomAccentColorLight('#546de5');
    }
  };

  const handleDarkColorReset = () => {
    if (setCustomAccentColorDark) {
      setCustomAccentColorDark('#546de5');
    }
  };

  const renderThemeVariants = (themes, selectedVariant, onSelect, label) => (
    <div className="theme-variant-section">
      <div className="theme-variant-label">{label}</div>
      <div className="theme-variants">
        {themes.map((theme) => (
          <ThemeVariantCard
            key={theme.id}
            theme={theme}
            isSelected={selectedVariant === theme.id}
            onClick={() => onSelect(theme.id)}
          />
        ))}
      </div>
    </div>
  );

  const renderCustomizationSection = (themeMode, customColor, onColorChange, onColorReset) => {
    // Add safety checks to prevent errors
    if (!customColor || !onColorChange || !onColorReset) {
      return null;
    }

    return (
      <div className="customization-section">
        <div className="customization-header">
          <span className="customization-title">Customization</span>
          <span className="customization-subtitle">Personalize your {themeMode} theme</span>
        </div>
        <ColorPicker
          label={`${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} Accent Color`}
          value={customColor}
          onChange={onColorChange}
          onReset={onColorReset}
        />
      </div>
    );
  };

  return (
    <StyledWrapper>
      <div className="flex flex-col gap-4 w-full appearance-container">
        <div>
          <div className="section-header">Appearance</div>
        </div>

        <div className="flex gap-3 theme-mode-selector justify-start">
          {themeModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = storedTheme === mode.key;

            return (
              <button
                key={mode.key}
                onClick={() => handleModeChange(mode.key)}
                className={`theme-mode-option relative ${isSelected ? 'selected' : ''}`}
              >
                <div className="flex items-center justify-start gap-2">
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{mode.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="section-divider" />

        {storedTheme === 'light' && (
          <>
            {renderThemeVariants(lightThemes, themeVariantLight, setThemeVariantLight, 'Light Theme')}
            <div className="section-divider" />
            {renderCustomizationSection('light', customAccentColorLight, handleLightColorChange, handleLightColorReset)}
          </>
        )}

        {storedTheme === 'dark' && (
          <>
            {renderThemeVariants(darkThemes, themeVariantDark, setThemeVariantDark, 'Dark Theme')}
            <div className="section-divider" />
            {renderCustomizationSection('dark', customAccentColorDark, handleDarkColorChange, handleDarkColorReset)}
          </>
        )}

        {storedTheme === 'system' && (
          <>
            {renderThemeVariants(lightThemes, themeVariantLight, setThemeVariantLight, 'Light Theme')}
            <div className="section-divider" />
            {renderCustomizationSection('light', customAccentColorLight, handleLightColorChange, handleLightColorReset)}
            <div className="section-divider" />
            {renderThemeVariants(darkThemes, themeVariantDark, setThemeVariantDark, 'Dark Theme')}
            <div className="section-divider" />
            {renderCustomizationSection('dark', customAccentColorDark, handleDarkColorChange, handleDarkColorReset)}
          </>
        )}
      </div>
    </StyledWrapper>
  );
};

export default Themes;
