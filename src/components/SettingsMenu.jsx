import React, { useEffect, useId, useRef, useState } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import './SettingsMenu.css';

export default function SettingsMenu({ align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const themeSelectId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`settings-menu settings-menu-${align}`} ref={menuRef}>
      <button
        type="button"
        className="settings-menu-button"
        aria-label="Open settings"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(current => !current)}
      >
        <span className="settings-menu-icon" aria-hidden="true">⚙</span>
      </button>

      {isOpen && (
        <div className="settings-menu-panel" role="dialog" aria-label="Settings">
          <h2>Settings</h2>
          <div className="settings-menu-row">
            <span className="settings-menu-label">Theme</span>
            <ThemeSwitcher selectId={`${themeSelectId}-theme`} />
          </div>
        </div>
      )}
    </div>
  );
}
