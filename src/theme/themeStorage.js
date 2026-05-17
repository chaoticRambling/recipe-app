import { DEFAULT_THEME_ID, getThemeById, normalizeThemeId } from './themeCatalog';

export const THEME_STORAGE_KEY = 'recipe-app.themeId';

export function readStoredThemeId() {
  try {
    return normalizeThemeId(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function writeStoredThemeId(themeId) {
  const normalizedThemeId = normalizeThemeId(themeId);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedThemeId);
  } catch {
    // localStorage can fail in private browsing or restricted environments.
  }

  return normalizedThemeId;
}

export function applyTheme(themeId) {
  if (typeof document === 'undefined') return;

  const normalizedThemeId = normalizeThemeId(themeId);
  const theme = getThemeById(normalizedThemeId);
  document.documentElement.dataset.theme = normalizedThemeId;

  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', theme.metaThemeColor);
}
