import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe } from '../adapters/database';
import Desktop95ScrollArea from '../components/Desktop95ScrollArea';
import IngredientList from '../components/IngredientList';
import SettingsMenu from '../components/SettingsMenu';
import { hasUnscaledIngredients } from '../utils/scalingMath';
import { useTheme } from '../theme/useTheme';
import './RecipeViewer.css';

export default function RecipeViewer({ session }) {
  const { id } = useParams();
  const recipeId = id || '123';
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [multiplier, setMultiplier] = useState(1);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [stepByStepMode, setStepByStepMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    async function fetchRecipe() {
      setIsLoading(true);
      const data = await getRecipe(recipeId);
      setRecipe(data);
      setIsLoading(false);
    }
    fetchRecipe();
  }, [recipeId]);

  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          setIsWakeLockActive(true);
          wakeLock.addEventListener('release', () => {
            setIsWakeLockActive(false);
          });
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, []);

  if (isLoading) return <div className="loader">Loading recipe...</div>;

  if (!recipe) {
    return (
      <div className="not-found-container">
        <h2>404: Recipe Not Found</h2>
        <p>We couldn't find the recipe you're looking for.</p>
        <button onClick={() => navigate('/')} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleMultiplier = (val) => setMultiplier(val);
  const showScalingWarning = hasUnscaledIngredients(recipe.ingredients, multiplier);
  const startCookingLabel = activeTheme.id === 'desktop95' ? 'Start Cooking' : 'Step-by-Step Mode';

  const recipeView = (
    <div className="recipe-viewer">
      <nav className="recipe-nav">
        <button className="nav-back-btn" onClick={() => navigate('/')}>
          &larr; Back to Recipes
        </button>
        <div className="recipe-nav-actions">
          <SettingsMenu />
          {session && (
            <button className="nav-edit-btn" onClick={() => navigate(`/editor/${recipe.id}`)}>
              Edit Recipe
            </button>
          )}
        </div>
      </nav>
      <div className="recipe-hero" style={{ backgroundImage: `url('${recipe.image_url || activeTheme.assets.recipeHero}')` }}></div>
      <header className="recipe-header">
        <h1>{recipe.title || 'Untitled Recipe'}</h1>
        <div className="recipe-meta">
          {recipe.is_public && (
            <span className="pill-tag public-badge">
              <span className="public-icon" role="img" aria-label="globe">🌐</span> Public
            </span>
          )}
          <span className="pill-tag">{recipe.prep_time_minutes || 0} mins</span>
          {recipe.cuisine_type ? (
            recipe.cuisine_type.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} className="pill-tag">{tag}</span>
            ))
          ) : (
            <span className="pill-tag">Unknown</span>
          )}
        </div>
        {recipe.notes && <p className="recipe-notes">{recipe.notes}</p>}
      </header>

      <div className="recipe-content">
        <section className="ingredients-section">
          <div className="section-header">
            <h2>Ingredients</h2>
            <div className="multiplier-controls">
              {[0.5, 1, 2].map((val) => (
                <button 
                  key={val} 
                  className={multiplier === val ? 'active-multiplier' : ''}
                  onClick={() => handleMultiplier(val)}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
          {showScalingWarning && (
            <p className="scaling-warning">Some ingredients were not scaled.</p>
          )}
          <IngredientList sections={recipe.ingredients} multiplier={multiplier} />
        </section>

        <section className="steps-section">
          <div className="section-header">
            <h2>Instructions</h2>
            <button 
              className="toggle-btn"
              onClick={() => {
                setStepByStepMode(!stepByStepMode);
                setCurrentStepIndex(0);
              }}
            >
              {stepByStepMode ? 'Show All Steps' : startCookingLabel}
            </button>
          </div>

          {(!recipe.steps || recipe.steps.length === 0) ? (
            <p className="defensive-fallback">No instructions available.</p>
          ) : stepByStepMode ? (
            <div className="step-by-step-view">
              <div className="step-card focus-mode">
                <span className="step-number">Step {recipe.steps[currentStepIndex].step_number}</span>
                <p className="step-text">{recipe.steps[currentStepIndex].text}</p>
                {recipe.steps[currentStepIndex].image_url && (
                  <img 
                    src={recipe.steps[currentStepIndex].image_url} 
                    alt={`Step ${recipe.steps[currentStepIndex].step_number}`}
                    className="step-image"
                  />
                )}
              </div>
              <div className="step-controls">
                <button 
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex(c => c - 1)}
                >
                  Previous
                </button>
                <button 
                  disabled={currentStepIndex === recipe.steps.length - 1}
                  onClick={() => setCurrentStepIndex(c => c + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <Desktop95ScrollArea className="steps-list-view" contentClassName="steps-list-content" scrollStep={150}>
              {recipe.steps.map((step) => (
                <div key={step.step_number} className="step-card">
                  <span className="step-number">{step.step_number}</span>
                  <p className="step-text">{step.text}</p>
                </div>
              ))}
            </Desktop95ScrollArea>
          )}
        </section>
      </div>

      {(recipe.draft_ingredients || recipe.draft_steps) && (
        <section className="rough-notes-section">
          <div className="section-header">
            <h2>Rough Notes</h2>
          </div>
          {recipe.draft_ingredients && (
            <div className="rough-notes-box">
              <h3>Draft Ingredients</h3>
              <pre>{recipe.draft_ingredients}</pre>
            </div>
          )}
          {recipe.draft_steps && (
            <div className="rough-notes-box">
              <h3>Draft Steps</h3>
              <pre>{recipe.draft_steps}</pre>
            </div>
          )}
        </section>
      )}

      <footer className="recipe-footer">
        {isWakeLockActive ? (
          <span className="wakelock-status active">Cooking Mode: Screen Awake</span>
        ) : (
          <span className="wakelock-status">Cooking Mode: Screen Sleep Enabled</span>
        )}
      </footer>
    </div>
  );

  if (activeTheme.id === 'desktop95') {
    return (
      <Desktop95ScrollArea
        className="recipe-page-scroll"
        contentClassName="recipe-page-scroll-content"
        scrollStep={240}
      >
        {recipeView}
      </Desktop95ScrollArea>
    );
  }

  return recipeView;
}
