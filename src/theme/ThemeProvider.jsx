import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getUserThemePreference, saveUserThemePreference } from '../adapters/userPreferences';
import { ThemeContext } from './ThemeContext';
import { DEFAULT_THEME_ID, THEMES, getThemeById, normalizeThemeId } from './themeCatalog';
import { applyTheme, readStoredThemeId, writeStoredThemeId } from './themeStorage';

export default function ThemeProvider({ session, children }) {
  const userId = session?.user?.id || null;
  const [themeId, setThemeIdState] = useState(() => readStoredThemeId());
  const [syncState, setSyncState] = useState('idle');
  const themeIdRef = useRef(themeId);

  useLayoutEffect(() => {
    themeIdRef.current = themeId;
    applyTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    if (!userId) {
      setSyncState('idle');
      return undefined;
    }

    let isCanceled = false;

    async function syncThemeFromProfile() {
      setSyncState('syncing');
      try {
        const savedThemeId = await getUserThemePreference(userId);
        if (isCanceled) return;

        if (savedThemeId) {
          const normalizedThemeId = writeStoredThemeId(savedThemeId);
          setThemeIdState(normalizedThemeId);
        } else {
          await saveUserThemePreference(userId, themeIdRef.current || DEFAULT_THEME_ID);
        }

        if (!isCanceled) setSyncState('idle');
      } catch (error) {
        console.error('Theme preference sync failed:', error);
        if (!isCanceled) setSyncState('error');
      }
    }

    syncThemeFromProfile();

    return () => {
      isCanceled = true;
    };
  }, [userId]);

  const setThemeId = useCallback((nextThemeId) => {
    const normalizedThemeId = normalizeThemeId(nextThemeId);
    writeStoredThemeId(normalizedThemeId);
    setThemeIdState(normalizedThemeId);

    if (userId) {
      setSyncState('syncing');
      saveUserThemePreference(userId, normalizedThemeId)
        .then(() => setSyncState('idle'))
        .catch((error) => {
          console.error('Theme preference save failed:', error);
          setSyncState('error');
        });
    }
  }, [userId]);

  const value = useMemo(() => ({
    activeTheme: getThemeById(themeId),
    themeId,
    themes: THEMES,
    setThemeId,
    syncState
  }), [setThemeId, syncState, themeId]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
