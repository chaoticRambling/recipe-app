import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe } from '../adapters/database';
import { getGroceryItems, addGroceryItem } from '../adapters/groceriesDatabase';
import Desktop95ScrollArea from '../components/Desktop95ScrollArea';
import IngredientList from '../components/IngredientList';
import { hasUnscaledIngredients } from '../utils/scalingMath';
import { useTheme } from '../theme/useTheme';
import './RecipeViewer.css';

const AISLE_SUGGESTIONS = [
  'Produce',
  'Dairy/Alternative',
  'Bakery',
  'Frozen',
  'Pantry',
  'Meat',
  'Seafood',
  'Beverages',
  'General'
];

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

  // Grocery populate state
  const [isGroceryMode, setIsGroceryMode] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState({}); // key -> { name, quantity, store, aisle }
  const [currentGroceries, setCurrentGroceries] = useState([]);
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('recipe_app_stores');
    return saved ? JSON.parse(saved) : ["Trader Joe's", "Whole Foods", "Costco", "Local Market"];
  });
  
  // Custom Toast/MessageBox notification state
  const [notification, setNotification] = useState(null); // { type, message, count }

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
    if (isGroceryMode) {
      async function loadGroceries() {
        try {
          const loaded = await getGroceryItems(session);
          setCurrentGroceries(loaded);
        } catch (err) {
          console.error("Failed to load groceries:", err);
        }
      }
      loadGroceries();
    }
  }, [isGroceryMode, session]);

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

  // Auto-dismiss modern success toast after 4s
  useEffect(() => {
    if (notification && activeTheme.id !== 'desktop95') {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, activeTheme.id]);

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

  const handleToggleIngredient = (key, parsedItem) => {
    setSelectedIngredients(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          ...parsedItem,
          key: key,
          store: stores[0] || "Trader Joe's",
          aisle: "Produce"
        };
      }
      return next;
    });
  };

  const handleUpdateItemConfig = (key, field, value) => {
    setSelectedIngredients(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleAddSelectedGroceries = async () => {
    const itemsToAdd = Object.values(selectedIngredients);
    if (itemsToAdd.length === 0) return;

    try {
      for (const item of itemsToAdd) {
        await addGroceryItem(session, {
          name: item.name,
          quantity: item.quantity || '',
          aisle: item.aisle || 'Produce',
          store: item.store || stores[0] || "Trader Joe's"
        });
      }
      
      setSelectedIngredients({});
      setIsGroceryMode(false);
      setNotification({
        type: 'success',
        count: itemsToAdd.length,
        message: `Successfully added ${itemsToAdd.length} items to your Grocery List!`
      });
    } catch (err) {
      console.error("Failed to add groceries:", err);
      alert("Error adding items to grocery list.");
    }
  };

  const selectedCount = Object.keys(selectedIngredients).length;

  const modernDrawer = isGroceryMode && activeTheme.id !== 'desktop95' && (
    <div className="grocery-drawer">
      <div className="grocery-drawer-header">
        <h3>🛒 Shop Ingredients</h3>
        <button className="close-drawer-btn" onClick={() => setIsGroceryMode(false)}>&times;</button>
      </div>
      <div className="grocery-drawer-content">
        <div className="checked-ingredients-summary" style={{ display: 'flex', flexDirection: 'column', maxHeight: '320px' }}>
          <h4 style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>Selected Ingredients ({selectedCount})</h4>
          {selectedCount === 0 ? (
            <p className="checked-ingredients-empty">Check items in the recipe to add them.</p>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {Object.values(selectedIngredients).map((item) => (
                <div key={item.key} className="drawer-selected-item-config">
                  <span className="selected-item-text">
                    {item.quantity && <strong>{item.quantity} </strong>}
                    {item.name}
                  </span>
                  <div className="selected-item-dropdowns">
                    <select 
                      value={item.store} 
                      onChange={(e) => handleUpdateItemConfig(item.key, 'store', e.target.value)}
                    >
                      {stores.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                      value={item.aisle}
                      onChange={(e) => handleUpdateItemConfig(item.key, 'aisle', e.target.value)}
                    >
                      {AISLE_SUGGESTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grocery-drawer-preview" style={{ flex: 1, minHeight: 0 }}>
          <h4>Current Grocery List Preview</h4>
          <div className="preview-list-box" style={{ maxHeight: 'none', flex: 1 }}>
            {currentGroceries.length === 0 ? (
              <p className="checked-ingredients-empty">Your shopping list is empty.</p>
            ) : (
              currentGroceries.map((item) => (
                <div key={item.id} className="preview-item-row">
                  <span className="preview-item-name">
                    {item.checked ? '✓ ' : ''}{item.name} {item.quantity && `(${item.quantity})`}
                  </span>
                  <span className="preview-item-meta">
                    {item.store} | {item.aisle}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="grocery-drawer-footer">
        <button className="nav-edit-btn" onClick={() => setIsGroceryMode(false)}>Cancel</button>
        <button 
          className="nav-edit-btn" 
          style={{ background: 'var(--accent-color)', color: 'var(--color-on-primary)', border: 'none' }}
          disabled={selectedCount === 0}
          onClick={handleAddSelectedGroceries}
        >
          Add {selectedCount} Selected
        </button>
      </div>
    </div>
  );

  const retroDialog = isGroceryMode && activeTheme.id === 'desktop95' && (
    <div className="win95-dialog-overlay" onClick={() => setIsGroceryMode(false)}>
      <div className="win95-dialog win95-grocery-populator-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="win95-dialog-titlebar">
          <span>Kitchen 95 Shopping Assistant</span>
          <button className="win95-titlebar-btn-close" onClick={() => setIsGroceryMode(false)}>×</button>
        </div>
        <div className="win95-dialog-body">
          <div>
            <h4 className="win95-section-title-retro">📌 Selected Ingredients ({selectedCount})</h4>
            <div className="win95-inset-scroller" style={{ height: '160px' }}>
              {selectedCount === 0 ? (
                <p style={{ fontStyle: 'italic', margin: '4px', color: '#808080' }}>
                  No ingredients selected. Check items in the recipe.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.values(selectedIngredients).map((item) => (
                    <div key={item.key} className="drawer-selected-item-config">
                      <span className="selected-item-text">
                        {item.quantity && <strong>{item.quantity} </strong>}
                        {item.name}
                      </span>
                      <div className="selected-item-dropdowns">
                        <select 
                          className="win95-retro-select"
                          value={item.store} 
                          onChange={(e) => handleUpdateItemConfig(item.key, 'store', e.target.value)}
                        >
                          {stores.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                          className="win95-retro-select"
                          value={item.aisle}
                          onChange={(e) => handleUpdateItemConfig(item.key, 'aisle', e.target.value)}
                        >
                          {AISLE_SUGGESTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="win95-section-title-retro">🏪 Current Grocery List ({currentGroceries.length})</h4>
            <div className="win95-inset-scroller" style={{ height: '100px' }}>
              {currentGroceries.length === 0 ? (
                <p style={{ fontStyle: 'italic', margin: '4px', color: '#808080' }}>Your grocery list is empty.</p>
              ) : (
                currentGroceries.map((item) => (
                  <div key={item.id} style={{ display: 'flex', borderBottom: '1px solid #D0D0D0', padding: '2px 0' }}>
                    <span>{item.checked ? '☑ ' : '☐ '}{item.name} {item.quantity && `(${item.quantity})`}</span>
                    <span style={{ color: '#808080', fontSize: '0.75rem', marginLeft: 'auto' }}>{item.store} | {item.aisle}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="win95-dialog-actions">
            <button 
              className="win95-btn" 
              disabled={selectedCount === 0} 
              onClick={handleAddSelectedGroceries}
              style={{ fontWeight: 'bold' }}
            >
              OK
            </button>
            <button className="win95-btn" onClick={() => setIsGroceryMode(false)}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Notification toast/messagebox markup
  const successNotification = notification && (
    activeTheme.id === 'desktop95' ? (
      <div className="win95-messagebox-overlay">
        <div className="win95-dialog win95-messagebox">
          <div className="win95-dialog-titlebar">
            <span>Information</span>
            <button className="win95-titlebar-btn-close" onClick={() => setNotification(null)}>×</button>
          </div>
          <div className="win95-messagebox-body">
            <div className="win95-messagebox-text-row">
              <div className="win95-messagebox-icon-blue-i">i</div>
              <span className="win95-messagebox-text">
                Successfully added {notification.count} items to your Grocery List.
              </span>
            </div>
            <div className="win95-messagebox-actions">
              <button 
                className="win95-btn win95-messagebox-btn-ok" 
                onClick={() => setNotification(null)}
                style={{ fontWeight: 'bold' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="modern-toast">
        <span className="modern-toast-icon">✓</span>
        <span>{notification.message}</span>
      </div>
    )
  );

  const recipeView = (
    <div className="recipe-viewer">
      <nav className="recipe-nav">
        <button className="nav-back-btn" onClick={() => navigate('/')}>
          &larr; Back to Recipes
        </button>
        <div className="recipe-nav-actions">
          <button 
            className="nav-edit-btn"
            onClick={() => {
              setIsGroceryMode(!isGroceryMode);
              setSelectedIngredients({});
            }}
            style={isGroceryMode ? (activeTheme.id === 'desktop95' ? { background: '#000080', color: '#FFFFFF', boxShadow: 'inset 1px 1px 0 #0a0a0a' } : { borderColor: 'var(--success-color)', color: 'var(--success-color)' }) : undefined}
          >
            {isGroceryMode ? 'Exit Selection' : '🛒 Shop Ingredients'}
          </button>
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
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
              <button 
                className="toggle-btn"
                onClick={() => {
                  setIsGroceryMode(!isGroceryMode);
                  setSelectedIngredients({});
                }}
                style={isGroceryMode ? (activeTheme.id === 'desktop95' ? { background: '#000080', color: '#FFFFFF', boxShadow: 'inset 1px 1px 0 #0a0a0a' } : { borderColor: 'var(--success-color)', color: 'var(--success-color)' }) : undefined}
              >
                {isGroceryMode ? 'Cancel Shop' : '🛒 Shop Ingredients'}
              </button>
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
          </div>
          {showScalingWarning && (
            <p className="scaling-warning">Some ingredients were not scaled.</p>
          )}
          <IngredientList 
            sections={recipe.ingredients} 
            multiplier={multiplier} 
            selectable={isGroceryMode}
            selectedItems={selectedIngredients}
            onToggleItem={handleToggleIngredient}
          />
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
      <>
        <Desktop95ScrollArea
          className="recipe-page-scroll"
          contentClassName="recipe-page-scroll-content"
          scrollStep={240}
        >
          {recipeView}
        </Desktop95ScrollArea>
        {retroDialog}
        {successNotification}
      </>
    );
  }

  return (
    <>
      {recipeView}
      {modernDrawer}
      {successNotification}
    </>
  );
}
