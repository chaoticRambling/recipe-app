import React from 'react';
import { useTheme } from '../theme/useTheme';
import './ThemeSwitcher.css';

export default function ThemeSwitcher() {
  const { activeTheme, setThemeId, themeId, themes } = useTheme();

  return (
    <div className="theme-switcher">
      <div className="theme-switcher-swatches" aria-hidden="true">
        {activeTheme.swatches.map((swatch) => (
          <span
            key={swatch}
            className="theme-swatch"
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      <label className="visually-hidden" htmlFor="theme-select">Recipe skin</label>
      <select
        id="theme-select"
        className="theme-select"
        value={themeId}
        onChange={(event) => setThemeId(event.target.value)}
        aria-label="Recipe skin"
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}
