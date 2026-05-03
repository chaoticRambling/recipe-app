import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe, createRecipe, updateRecipe } from '../adapters/database';
import IngredientEditor from '../components/IngredientEditor';
import StepEditor from '../components/StepEditor';
import './RecipeEditor.css';

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [notes, setNotes] = useState('');
  
  const [draftIngredients, setDraftIngredients] = useState('');
  const [draftSteps, setDraftSteps] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  
  const [sections, setSections] = useState([{ section_name: 'Main', items: [] }]);
  const [steps, setSteps] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getRecipe(id).then(data => {
        if (data) {
          setTitle(data.title || '');
          setPrepTime(data.prep_time_minutes || '');
          setCuisine(data.cuisine_type || '');
          setNotes(data.notes || '');
          setSections(data.ingredients || [{ section_name: 'Main', items: [] }]);
          setSteps(data.steps || []);
          setDraftIngredients(data.draft_ingredients || '');
          setDraftSteps(data.draft_steps || '');
          setIsDraft(data.is_draft ?? true);
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    const payload = {
      title,
      prep_time_minutes: parseInt(prepTime) || 0,
      cuisine_type: cuisine,
      notes,
      ingredients: sections,
      steps: steps,
      draft_ingredients: draftIngredients,
      draft_steps: draftSteps,
      is_draft: isDraft,
      updated_at: new Date().toISOString()
    };
    
    try {
      let targetId = id;
      if (id) {
        await updateRecipe(id, payload);
      } else {
        payload.created_at = new Date().toISOString();
        const newRecipe = await createRecipe(payload);
        targetId = newRecipe.id;
      }
      
      navigate(`/recipe/${targetId}`);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(err.message || 'An error occurred while saving.');
    }
  };

  if (isLoading) return <div className="loader">Loading editor...</div>;

  return (
    <form className="recipe-editor-page" onSubmit={handleSave}>
      <header className="editor-header">
        <button type="button" className="nav-back-btn" onClick={() => navigate('/')}>
          &larr; Cancel
        </button>
        <h1>{id ? 'Edit Recipe' : 'New Recipe'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {saveError && <span style={{ color: 'red', fontSize: '0.9rem' }}>{saveError}</span>}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
            Save as Draft
          </label>
          <button type="submit" className="save-btn">Save Recipe</button>
        </div>
      </header>

      <div className="editor-layout">
        {/* Left Pane - Drafts */}
        <div className="editor-left-pane">
          <h2>Draft Scratchpad</h2>
          <p className="help-text">Paste unstructured text here to reference while building the strict structure on the right.</p>
          <div className="form-group">
            <label>Draft Ingredients</label>
            <textarea 
              className="draft-area" 
              value={draftIngredients} 
              onChange={e => setDraftIngredients(e.target.value)} 
              placeholder="Paste raw ingredients list here..."
            />
          </div>
          <div className="form-group">
            <label>Draft Steps</label>
            <textarea 
              className="draft-area" 
              value={draftSteps} 
              onChange={e => setDraftSteps(e.target.value)} 
              placeholder="Paste raw steps here..."
            />
          </div>
        </div>

        {/* Right Pane - Structure */}
        <div className="editor-right-pane">
          <h2>Recipe Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Recipe Title" />
            </div>
            <div className="form-group">
              <label>Prep Time (mins)</label>
              <input type="number" required value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="30" />
            </div>
            <div className="form-group">
              <label>Cuisine Type</label>
              <input type="text" value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder="e.g. Italian" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional context or tips..." rows="2" />
          </div>

          <hr className="editor-divider" />
          
          <IngredientEditor sections={sections} setSections={setSections} />
          
          <hr className="editor-divider" />
          
          <StepEditor steps={steps} setSteps={setSteps} />
        </div>
      </div>
    </form>
  );
}
