import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRecipe, getRecipes } from '../adapters/database';
import { importRecipeFromUrl } from '../adapters/importRecipe';
import { supabase } from '../supabaseClient';
import RecipeList from '../components/RecipeList';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../theme/useTheme';
import { usesTopTabs } from '../theme/themeCatalog';
import './DashboardView.css';

const IMPORT_SOURCE_LABELS = {
  'json-ld': 'recipe metadata',
  wprm: 'site recipe metadata',
  openai: 'LLM parsing'
};

export default function DashboardView({ session }) {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const useTopTabs = usesTopTabs(activeTheme);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [importedRecipe, setImportedRecipe] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');

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

  useEffect(() => {
    if (!isImporting) return undefined;

    const timer = window.setInterval(() => {
      setImportProgress(prev => {
        if (prev < 35) return prev + 5;
        if (prev < 70) return prev + 3;
        if (prev < 88) return prev + 1;
        return prev;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [isImporting]);

  const handleUrlImport = async (event) => {
    event.preventDefault();
    setImportError('');
    setImportedRecipe(null);
    setIsImporting(true);
    setImportProgress(8);
    setImportStatus('Fetching the recipe page...');

    try {
      const trimmedUrl = importUrl.trim();
      const { recipe, source } = await importRecipeFromUrl(trimmedUrl);
      setImportProgress(90);
      setImportStatus('Creating draft recipe...');
      const now = new Date().toISOString();
      const draft = {
        title: recipe.title || 'Imported Recipe',
        prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
        cuisine_type: recipe.cuisine_type || '',
        notes: recipe.notes || '',
        ingredients: recipe.ingredients || [{ section_name: 'Main', items: [] }],
        steps: recipe.steps || [],
        draft_ingredients: recipe.draft_ingredients || '',
        draft_steps: recipe.draft_steps || '',
        is_draft: true,
        image_url: recipe.image_url || null,
        source_url: trimmedUrl,
        created_at: now,
        updated_at: now
      };
      const savedRecipe = await createRecipe(draft);
      setImportProgress(100);
      setImportStatus('Draft ready.');
      setRecipes(prev => [savedRecipe, ...prev]);
      setImportedRecipe({ ...savedRecipe, importSource: source });
      setImportUrl('');
    } catch (error) {
      setImportError(error.message || 'Recipe import failed.');
    } finally {
      setIsImporting(false);
      window.setTimeout(() => {
        setImportProgress(0);
        setImportStatus('');
      }, 900);
    }
  };

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

        <section className="import-panel">
          <form className="import-form" onSubmit={handleUrlImport}>
            <div className="import-copy">
              <h2>Import From URL</h2>
              <p>Create a draft recipe from a webpage, then review it in the editor.</p>
            </div>
            <div className="import-controls">
              <input
                type="url"
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
                placeholder="https://example.com/recipe"
                disabled={isImporting}
                required
              />
              <button type="submit" disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </form>

          {importError && (
            <p className="import-message import-error">{importError}</p>
          )}

          {(isImporting || importProgress > 0) && (
            <div className="import-progress" role="status" aria-live="polite">
              <div className="import-progress-row">
                <span>{importStatus || 'Importing recipe...'}</span>
                <span>{Math.round(importProgress)}%</span>
              </div>
              <div className="import-progress-track" aria-hidden="true">
                <div
                  className="import-progress-fill"
                  style={{ width: `${Math.min(importProgress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {importedRecipe && (
            <div className="import-success">
              <p>
                Draft imported from {IMPORT_SOURCE_LABELS[importedRecipe.importSource] || 'recipe parsing'}.
              </p>
              <div className="import-success-actions">
                <button type="button" onClick={() => navigate(`/editor/${importedRecipe.id}`)}>
                  Review Draft
                </button>
                <button type="button" className="secondary-action" onClick={() => setImportedRecipe(null)}>
                  Later
                </button>
              </div>
            </div>
          )}

        </section>

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
