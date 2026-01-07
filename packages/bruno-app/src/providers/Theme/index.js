import React from 'react';
import { Validator } from 'jsonschema';
import toast from 'react-hot-toast';
import themes from 'themes/index';
import themeSchema from 'themes/schema';
import useLocalStorage from 'hooks/useLocalStorage/index';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';

const validator = new Validator();

// Helper: Get effective theme ('light' or 'dark') based on storedTheme
const getEffectiveTheme = (storedTheme) => {
  if (storedTheme === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return storedTheme;
};

// Helper: Apply theme class to root element
const applyThemeToRoot = (theme) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

// Helper: Apply custom accent color to theme
const applyCustomAccentColor = (theme, customColor) => {
  if (!customColor || customColor === theme.brand) {
    return theme;
  }

  try {
    // Deep clone the theme to avoid mutations
    const customizedTheme = JSON.parse(JSON.stringify(theme));

    // Update brand color and related colors
    customizedTheme.brand = customColor;

    // Update primary colors
    if (customizedTheme.primary) {
      customizedTheme.primary.solid = customColor;
      customizedTheme.primary.text = customColor;
      customizedTheme.primary.strong = customColor;
    }

    // Update accents
    if (customizedTheme.accents) {
      customizedTheme.accents.primary = customColor;
    }

    // Update workspace accent
    if (customizedTheme.workspace) {
      customizedTheme.workspace.accent = customColor;
    }

    // Update input focus border
    if (customizedTheme.input) {
      customizedTheme.input.focusBorder = customColor;
    }

    // Helper function to apply color to nested objects recursively
    const applyColorToObject = (obj, colorPath, newColor) => {
      try {
        const parts = colorPath.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
          if (current[parts[i]]) {
            current = current[parts[i]];
          } else {
            return;
          }
        }

        const finalKey = parts[parts.length - 1];
        if (current[finalKey]) {
          current[finalKey] = newColor;
        }
      } catch (e) {
        // Silently ignore errors when applying nested colors
        console.warn(`Failed to apply color to ${colorPath}:`, e);
      }
    };

    // Update colors.accent (used for various accent colors)
    if (customizedTheme.colors) {
      customizedTheme.colors.accent = customColor;
    }

    // Update button2 colors (primary buttons)
    applyColorToObject(customizedTheme, 'button2.color.primary.bg', customColor);
    applyColorToObject(customizedTheme, 'button2.color.primary.border', customColor);
    applyColorToObject(customizedTheme, 'button2.color.light.text', customColor);

    // Create rgba versions for light button backgrounds
    const rgba = (color, alpha) => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    applyColorToObject(customizedTheme, 'button2.color.light.bg', rgba(customColor, 0.08));
    applyColorToObject(customizedTheme, 'button2.color.light.border', rgba(customColor, 0.06));

    // Update sidebar active border
    applyColorToObject(customizedTheme, 'sidebar.dragbar.activeBorder', customColor);

    // Update button colors
    applyColorToObject(customizedTheme, 'button.primary.bg', customColor);
    applyColorToObject(customizedTheme, 'button.primary.border', customColor);

    // Update dropdown selected color
    applyColorToObject(customizedTheme, 'dropdown.selectedColor', customColor);

    // Update tab active border
    applyColorToObject(customizedTheme, 'requestTabPanel.dragbar.activeBorder', customColor);

    // Update checkbox color
    applyColorToObject(customizedTheme, 'request.checkboxColor', customColor);

    // Update specific button colors that might be hardcoded to orange
    applyColorToObject(customizedTheme, 'modal.buttonColor', customColor);
    applyColorToObject(customizedTheme, 'modal.buttonBg', rgba(customColor, 0.1));

    // Update any other accent-related properties
    applyColorToObject(customizedTheme, 'requestTabPanel.responseStatus', customColor);
    applyColorToObject(customizedTheme, 'sidebar.accent', customColor);

    return customizedTheme;
  } catch (e) {
    console.error('Failed to apply custom accent color:', e);
    return theme; // Return original theme if there's any error
  }
};

export const ThemeContext = createContext();
export const ThemeProvider = (props) => {
  const [storedTheme, setStoredTheme] = useLocalStorage('bruno.theme', 'system');
  const [displayedTheme, setDisplayedTheme] = useState(() => getEffectiveTheme(storedTheme));
  const [themeVariantLight, setThemeVariantLight] = useLocalStorage('bruno.themeVariantLight', 'light');
  const [themeVariantDark, setThemeVariantDark] = useLocalStorage('bruno.themeVariantDark', 'dark');
  const [customAccentColorLight, setCustomAccentColorLight] = useLocalStorage('bruno.customAccentColorLight', '#546de5');
  const [customAccentColorDark, setCustomAccentColorDark] = useLocalStorage('bruno.customAccentColorDark', '#546de5');

  // Listen for system theme changes (only affects 'system' mode)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e) => {
      if (storedTheme !== 'system') return;
      const newTheme = e.matches ? 'light' : 'dark';
      setDisplayedTheme(newTheme);
      applyThemeToRoot(newTheme);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storedTheme]);

  // Apply theme when storedTheme changes
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(storedTheme);
    setDisplayedTheme(effectiveTheme);
    applyThemeToRoot(effectiveTheme);

    if (window.ipcRenderer) {
      window.ipcRenderer.send('renderer:theme-change', storedTheme);
    }
  }, [storedTheme]);

  // storedTheme can have 3 values: 'light', 'dark', 'system'
  // displayedTheme can have 2 values: 'light', 'dark'

  // Compute theme object directly from storedTheme to avoid race conditions
  const theme = useMemo(() => {
    const isLightMode = getEffectiveTheme(storedTheme) === 'light';
    const variantName = isLightMode ? themeVariantLight : themeVariantDark;
    const fallbackTheme = isLightMode ? themes.light : themes.dark;
    const fallbackName = isLightMode ? 'light' : 'dark';
    const customAccentColor = isLightMode ? customAccentColorLight : customAccentColorDark;

    // Check if the variant exists in themes
    const selectedTheme = themes[variantName];
    if (!selectedTheme) {
      // Only show toast if using a non-default variant that doesn't exist
      if (variantName !== fallbackName) {
        toast.error(`Theme "${variantName}" not found. Using default ${fallbackName} theme.`, {
          duration: 4000,
          id: `theme-not-found-${variantName}` // Prevent duplicate toasts
        });
      }
      return applyCustomAccentColor(fallbackTheme, customAccentColor);
    }

    // Validate the theme against the schema
    const validationResult = validator.validate(selectedTheme, themeSchema);
    if (!validationResult.valid) {
      const errors = validationResult.errors?.map((e) => e.stack).join(', ') || 'Unknown validation error';
      console.error(`Theme "${variantName}" validation failed:`, errors);
      toast.error(`Invalid theme "${variantName}". Using default ${fallbackName} theme.`, {
        duration: 4000,
        id: `theme-invalid-${variantName}` // Prevent duplicate toasts
      });
      return applyCustomAccentColor(fallbackTheme, customAccentColor);
    }

    return applyCustomAccentColor(selectedTheme, customAccentColor);
  }, [storedTheme, themeVariantLight, themeVariantDark, customAccentColorLight, customAccentColorDark]);

  const value = {
    theme,
    storedTheme,
    displayedTheme,
    setStoredTheme,
    themeVariantLight,
    setThemeVariantLight,
    themeVariantDark,
    setThemeVariantDark,
    customAccentColorLight,
    setCustomAccentColorLight,
    customAccentColorDark,
    setCustomAccentColorDark
  };

  return (
    <ThemeContext.Provider value={value}>
      <SCThemeProvider theme={theme} {...props} />
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(`useTheme must be used within a ThemeProvider`);
  }

  return context;
};

export default ThemeProvider;
