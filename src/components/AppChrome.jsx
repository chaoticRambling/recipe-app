import React from 'react';
import { useTheme } from '../theme/useTheme';
import { usesWindowChrome, usesWindowControls } from '../theme/themeCatalog';
import './AppChrome.css';

export default function AppChrome({ children }) {
  const { activeTheme } = useTheme();
  const chrome = activeTheme.uiChrome || {};

  if (!usesWindowChrome(activeTheme)) {
    return children;
  }

  return (
    <div className="app-window-shell">
      <div className="app-window">
        <header className="app-titlebar">
          <div className="app-titlebar-brand">
            {chrome.icon && (
              <span className="app-titlebar-icon" aria-hidden="true">
                {chrome.icon}
              </span>
            )}
            <span className="app-titlebar-title">{chrome.title || activeTheme.name}</span>
          </div>
          {usesWindowControls(activeTheme) && (
            <div className="app-window-controls" aria-hidden="true">
              <button type="button" className="window-control" tabIndex="-1">_</button>
              <button type="button" className="window-control" tabIndex="-1">□</button>
              <button type="button" className="window-control" tabIndex="-1">×</button>
            </div>
          )}
        </header>
        <div className="app-window-content">
          {children}
        </div>
      </div>
    </div>
  );
}
