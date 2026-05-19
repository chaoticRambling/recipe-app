import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../adapters/database';
import { supabase } from '../supabaseClient';
import RecipeList from '../components/RecipeList';
import SettingsMenu from '../components/SettingsMenu';
import AppNavigation from '../components/AppNavigation';
import { useTheme } from '../theme/useTheme';
import { usesTopTabs } from '../theme/themeCatalog';
import Desktop95ScrollArea from '../components/Desktop95ScrollArea';
import './ExploreView.css';

export default function ExploreView({ session }) {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const useTopTabs = usesTopTabs(activeTheme);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await getRecipes();
        setRecipes(data || []);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  // Parse tags and compute counts
  const tagCounts = {};
  recipes.forEach(recipe => {
    if (recipe.cuisine_type) {
      const tags = recipe.cuisine_type
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const allTags = Object.keys(tagCounts)
    .map(name => ({
      name,
      count: tagCounts[name]
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const handleTagToggle = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    // If no search text and no tags selected, show all recipes
    if (selectedTags.length === 0 && searchText.trim() === '') {
      return true;
    }

    // 1. Tag matching ("AND" intersection)
    let matchesTags = true;
    if (selectedTags.length > 0) {
      if (!recipe.cuisine_type) {
        matchesTags = false;
      } else {
        const recipeTags = recipe.cuisine_type
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        matchesTags = selectedTags.every(tag => recipeTags.includes(tag));
      }
    }

    // 2. Text search matching (title, ingredients, instructions/steps)
    let matchesText = true;
    if (searchText.trim() !== '') {
      const query = searchText.toLowerCase().trim();
      
      // Match Title
      const titleMatch = (recipe.title || '').toLowerCase().includes(query);
      
      // Match Ingredients
      let ingredientsText = '';
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(section => {
          if (section.section_name) ingredientsText += ' ' + section.section_name;
          if (Array.isArray(section.items)) {
            section.items.forEach(item => {
              ingredientsText += ' ' + (item.name || '') + ' ' + (item.amount || '') + ' ' + (item.unit || '');
            });
          }
        });
      } else if (typeof recipe.ingredients === 'string') {
        ingredientsText = recipe.ingredients;
      }
      const ingredientMatch = ingredientsText.toLowerCase().includes(query);

      // Match Instructions/Steps
      let stepsText = '';
      if (Array.isArray(recipe.steps)) {
        recipe.steps.forEach(step => {
          stepsText += ' ' + (step.text || '');
        });
      } else if (typeof recipe.steps === 'string') {
        stepsText = recipe.steps;
      }
      const stepMatch = stepsText.toLowerCase().includes(query);

      matchesText = titleMatch || ingredientMatch || stepMatch;
    }

    return matchesTags && matchesText;
  });

  const mainContent = (
    <>
      {useTopTabs && (
        <section className="desktop95-welcome" aria-label="Kitchen summary">
          <div className="desktop95-chef-avatar" aria-hidden="true">
            <img src="/desktop95-chef-placeholder.png" alt="" />
          </div>
          <div className="desktop95-welcome-copy">
            <p className="desktop95-kicker">Kitchen 95</p>
            <h2>Recipe Explorer</h2>
            <p>
              {loading
                ? 'Analyzing tag library...'
                : `${allTags.length} distinct tags found across your recipes.`}
            </p>
          </div>
          <div className="desktop95-status-tile" aria-label="Tag count">
            <span>{loading ? '--' : allTags.length}</span>
            <small>tags</small>
          </div>
        </section>
      )}

      <section className="explore-search-container">
        <div className="explore-search-wrapper">
          <span className="search-input-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search recipes, ingredients, steps..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              type="button"
              className="explore-search-clear-btn"
              onClick={() => setSearchText('')}
              aria-label="Clear search input"
            >
              ×
            </button>
          )}
        </div>
      </section>

      <section className="explore-tags-container">
        <h3>Filter by Tags</h3>
        {loading ? (
          <div className="loader">Loading tag cloud...</div>
        ) : allTags.length === 0 ? (
          <p className="explore-no-tags">No tags have been added to your recipes yet. Try editing a recipe to add tags!</p>
        ) : (
          <div className="explore-tags-grid">
            {allTags.map(tag => {
              const isActive = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.name}
                  type="button"
                  className={`explore-tag-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag.name)}
                >
                  <span className="tag-name-label">{tag.name}</span>
                  <span className="tag-count-badge">({tag.count})</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="explore-results-container">
        {loading ? (
          <div className="loader">Loading recipes...</div>
        ) : filteredRecipes.length === 0 ? (
          searchText.trim() !== '' || selectedTags.length > 0 ? (
            <div className="explore-empty-results">
              <p>No recipes match your criteria: 
                {searchText.trim() !== '' && <span> Search: "<strong>{searchText}</strong>"</span>}
                {selectedTags.length > 0 && <span> Tags: <strong>{selectedTags.join(' + ')}</strong></span>}
              </p>
              <button 
                type="button" 
                className="clear-filters-btn"
                onClick={() => {
                  setSelectedTags([]);
                  setSearchText('');
                }}
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="explore-empty-results">
              <p>No recipes found in your recipe box yet.</p>
            </div>
          )
        ) : (
          <div className="explore-filtered-list">
            <div className="explore-results-header">
              <h3>
                {selectedTags.length === 0 && searchText.trim() === '' 
                  ? `All Recipes (${filteredRecipes.length})` 
                  : `Matching Recipes (${filteredRecipes.length})`}
              </h3>
              {(selectedTags.length > 0 || searchText.trim() !== '') && (
                <button 
                  type="button" 
                  className="clear-filters-link"
                  onClick={() => {
                    setSelectedTags([]);
                    setSearchText('');
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <RecipeList recipes={filteredRecipes} />
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="dashboard-view explore-view">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Explore by Tags</h1>
          <div className="header-actions">
            <SettingsMenu />
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
        <AppNavigation />
      )}

      <main className="dashboard-main explore-main">
        {activeTheme.id === 'desktop95' ? (
          <Desktop95ScrollArea
            className="explore-page-scroll"
            contentClassName="explore-page-scroll-content"
            scrollStep={240}
          >
            {mainContent}
          </Desktop95ScrollArea>
        ) : (
          mainContent
        )}
      </main>

      {!useTopTabs && (
        <AppNavigation />
      )}
    </div>
  );
}
