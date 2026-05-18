import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../adapters/database';
import { supabase } from '../supabaseClient';
import RecipeList from '../components/RecipeList';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../theme/useTheme';
import { usesTopTabs } from '../theme/themeCatalog';
import './DashboardView.css';

export default function DashboardView({ session }) {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const useTopTabs = usesTopTabs(activeTheme);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await getRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  return (
    <div className="dashboard-view">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>My Recipes</h1>
          <div className="header-actions">
            <ThemeSwitcher />
            {session && (
              <button 
                className="logout-btn" 
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/login');
                }}
              >
                Log Out
              </button>
            )}
            <button className="new-recipe-btn" onClick={() => navigate('/editor')}>
              + New Recipe
            </button>
          </div>
        </div>
      </header>

      {useTopTabs && (
        <nav className="top-tab-nav" aria-label="Recipe app sections">
          <button type="button" className="top-tab active">
            Saved Recipes
          </button>
          <button type="button" className="top-tab">
            Grocery List
          </button>
          <button type="button" className="top-tab">
            Search
          </button>
        </nav>
      )}

      <main className="dashboard-main">
        {useTopTabs && (
          <section className="desktop95-welcome" aria-label="Kitchen summary">
            <div className="desktop95-chef-avatar" aria-hidden="true">
              <img src="/desktop95-chef-placeholder.png" alt="" />
            </div>
            <div className="desktop95-welcome-copy">
              <p className="desktop95-kicker">Kitchen 95</p>
              <h2>Welcome back, Chef!</h2>
              <p>
                {loading
                  ? 'Opening your recipe box...'
                  : `${recipes.length} saved ${recipes.length === 1 ? 'recipe' : 'recipes'} ready to cook.`}
              </p>
            </div>
            <div className="desktop95-status-tile" aria-label="Recipe count">
              <span>{loading ? '--' : recipes.length}</span>
              <small>recipes</small>
            </div>
          </section>
        )}

        {loading ? (
          <div className="loader">Loading recipes...</div>
        ) : (
          <RecipeList recipes={recipes} />
        )}
      </main>

      {!useTopTabs && (
        <nav className="bottom-nav">
          <button className="nav-item active">
            <span className="nav-icon">🥄</span>
            <span>Recipes</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🧺</span>
            <span>Groceries</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🔍</span>
            <span>Search</span>
          </button>
        </nav>
      )}
    </div>
  );
}
