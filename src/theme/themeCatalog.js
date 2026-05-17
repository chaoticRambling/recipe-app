export const DEFAULT_THEME_ID = 'classic';

export const THEMES = [
  {
    id: 'classic',
    name: 'Classic Kitchen',
    metaThemeColor: '#FAFAF7',
    swatches: ['#FAFAF7', '#FFFFFF', '#E07A5F', '#81B29A'],
    assets: {
      loginBackground: '/login_bg.png',
      recipeHero: '/recipe_hero.png'
    }
  },
  {
    id: 'garden',
    name: 'Garden Table',
    metaThemeColor: '#F5F7EF',
    swatches: ['#F5F7EF', '#FFFFFF', '#4F8A5F', '#D89B42'],
    assets: {
      loginBackground: '/login_bg.png',
      recipeHero: '/recipe_hero.png'
    }
  },
  {
    id: 'citrus',
    name: 'Citrus Market',
    metaThemeColor: '#FFF9E8',
    swatches: ['#FFF9E8', '#FFFFFF', '#F28C28', '#2F8F83'],
    assets: {
      loginBackground: '/login_bg.png',
      recipeHero: '/recipe_hero.png'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Pantry',
    metaThemeColor: '#151922',
    swatches: ['#151922', '#222938', '#F0B35A', '#7FB8D8'],
    assets: {
      loginBackground: '/login_bg.png',
      recipeHero: '/recipe_hero.png'
    }
  },
  {
    id: 'desktop95',
    name: 'Desktop 95',
    metaThemeColor: '#C0C0C0',
    swatches: ['#C0C0C0', '#FFFFFF', '#000080', '#008080'],
    assets: {
      loginBackground: '/login_bg.png',
      recipeHero: '/recipe_hero.png'
    }
  }
];

export const THEME_BY_ID = THEMES.reduce((themes, theme) => {
  themes[theme.id] = theme;
  return themes;
}, {});

export function normalizeThemeId(themeId) {
  return THEME_BY_ID[themeId] ? themeId : DEFAULT_THEME_ID;
}

export function getThemeById(themeId) {
  return THEME_BY_ID[normalizeThemeId(themeId)];
}
