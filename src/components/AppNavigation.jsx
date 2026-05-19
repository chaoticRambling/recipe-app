import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/useTheme';
import { usesTopTabs } from '../theme/themeCatalog';

export default function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTheme } = useTheme();
  const useTopTabs = usesTopTabs(activeTheme);
  const currentPath = location.pathname;

  if (useTopTabs) {
    return (
      <nav className="top-tab-nav" aria-label="Recipe app sections">
        <button 
          type="button" 
          className={`top-tab ${currentPath === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          Saved Recipes
        </button>
        <button 
          type="button" 
          className={`top-tab ${currentPath === '/explore' ? 'active' : ''}`}
          onClick={() => navigate('/explore')}
        >
          Explore
        </button>
        <button type="button" className="top-tab">
          Grocery List
        </button>
        <button 
          type="button" 
          className={`top-tab ${currentPath === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${currentPath === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="nav-icon">🥄</span>
        <span>Recipes</span>
      </button>
      <button 
        className={`nav-item ${currentPath === '/explore' ? 'active' : ''}`}
        onClick={() => navigate('/explore')}
      >
        <span className="nav-icon">🔍</span>
        <span>Explore</span>
      </button>
      <button className="nav-item">
        <span className="nav-icon">🧺</span>
        <span>Groceries</span>
      </button>
      <button 
        className={`nav-item ${currentPath === '/settings' ? 'active' : ''}`}
        onClick={() => navigate('/settings')}
      >
        <span className="nav-icon">⚙</span>
        <span>Settings</span>
      </button>
    </nav>
  );
}
