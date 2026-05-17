import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe, createRecipe, updateRecipe, uploadRecipeImage, deleteRecipe, deleteRecipeImage } from '../adapters/database';
import imageCompression from 'browser-image-compression';
import IngredientEditor from '../components/IngredientEditor';
import StepEditor from '../components/StepEditor';
import './RecipeEditor.css';

const AccordionSection = ({ title, isOpen, onToggle, children, className }) => (
  <section className={`editor-section accordion ${className || ''} ${isOpen ? 'open' : ''}`}>
    <div className="accordion-header" onClick={onToggle}>
      <h2>{title}</h2>
      <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
    </div>
    <div className="accordion-content">
      {children}
    </div>
  </section>
);

const handleAutoResize = (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = e.target.scrollHeight + 'px';
};

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
  
  const [activeAccordion, setActiveAccordion] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);

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
          setExistingImageUrl(data.image_url || null);
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      setSelectedImageFile(compressedFile);
      setLocalPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Image compression failed:', error);
      setSaveError('Failed to process image.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    
    try {
      let finalImageUrl = existingImageUrl;
      
      if (selectedImageFile) {
        const imagePrefix = id || `new-${Date.now()}`;
        finalImageUrl = await uploadRecipeImage(selectedImageFile, imagePrefix);
      }

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
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      };
      
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
      setSaveError(err.message || 'An error occurred while saving. Make sure the recipe-images bucket exists and allows uploads.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) return;
    
    setIsSaving(true);
    setSaveError(null);
    try {
      if (existingImageUrl) {
        await deleteRecipeImage(existingImageUrl);
      }
      await deleteRecipe(id);
      navigate('/');
    } catch (err) {
      console.error('Delete failed:', err);
      setSaveError(err.message || 'Failed to delete recipe. Check Supabase permissions.');
      setIsSaving(false);
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
        
        {/* Desktop Action Bar */}
        <div className="desktop-action-bar" style={{ alignItems: 'center', gap: '1rem' }}>
          {saveError && <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{saveError}</span>}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
            Save as Draft
          </label>
          <button type="submit" className="save-btn" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </header>

      <div className="editor-layout">
        {/* Left Pane - Drafts */}
        <div className="editor-left-pane">
          <section className="editor-section" style={{ padding: 'var(--spacing-md)' }}>
            <h2>Draft Scratchpad</h2>
            <p className="help-text">Paste unstructured text here to reference while building the strict structure on the right.</p>
            <div className="form-group">
              <label>Draft Ingredients</label>
              <textarea 
                className="draft-area auto-resize" 
                value={draftIngredients} 
                onInput={handleAutoResize}
                onChange={e => setDraftIngredients(e.target.value)} 
                placeholder="Paste raw ingredients list here..."
              />
            </div>
            <div className="form-group">
              <label>Draft Steps</label>
              <textarea 
                className="draft-area auto-resize" 
                value={draftSteps} 
                onInput={handleAutoResize}
                onChange={e => setDraftSteps(e.target.value)} 
                placeholder="Paste raw steps here..."
              />
            </div>
          </section>
        </div>

        {/* Right Pane - Structure */}
        <div className="editor-right-pane">
          <div className="image-upload-section" style={{ marginBottom: 'var(--spacing-md)' }}>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              hidden 
              onChange={handleImageSelect} 
            />
            
            <div 
              className="image-preview-container"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: '200px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              {(localPreviewUrl || existingImageUrl) ? (
                <img 
                  src={localPreviewUrl || existingImageUrl} 
                  alt="Recipe Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tap to add photo</span>
              )}
            </div>
          </div>

          <AccordionSection 
            title="Basic Information" 
            isOpen={activeAccordion === 'basic'} 
            onToggle={() => setActiveAccordion(activeAccordion === 'basic' ? null : 'basic')}
          >
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
              <textarea 
                className="auto-resize"
                value={notes} 
                onInput={handleAutoResize}
                onChange={e => setNotes(e.target.value)} 
                placeholder="Optional context or tips..." 
                rows="2" 
              />
            </div>
          </AccordionSection>

          <AccordionSection 
            title="Ingredients" 
            isOpen={activeAccordion === 'ingredients'} 
            onToggle={() => setActiveAccordion(activeAccordion === 'ingredients' ? null : 'ingredients')}
          >
            <IngredientEditor sections={sections} setSections={setSections} />
          </AccordionSection>

          <AccordionSection 
            title="Instructions" 
            isOpen={activeAccordion === 'steps'} 
            onToggle={() => setActiveAccordion(activeAccordion === 'steps' ? null : 'steps')}
          >
            <StepEditor steps={steps} setSteps={setSteps} />
          </AccordionSection>

          <div style={{ textAlign: 'center', margin: 'var(--spacing-lg) 0' }}>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '0.8rem 1.5rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontWeight: 'bold' }}
            >
              Upload / Replace Photo
            </button>
          </div>
        </div>
      </div>

      {id && (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={isSaving}
            style={{ 
              backgroundColor: 'transparent', 
              color: 'var(--danger-color)', 
              border: '1px solid var(--danger-color)', 
              padding: '0.6rem 1.2rem', 
              borderRadius: 'var(--radius-md)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Delete Recipe
          </button>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-sticky-action-bar" style={{ flexDirection: saveError ? 'column' : 'row', gap: saveError ? '0.5rem' : '0' }}>
        {saveError ? (
          <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
            {saveError}
          </div>
        ) : (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
            Save as Draft
          </label>
        )}
        <button type="submit" className="save-btn" disabled={isSaving} style={{ width: saveError ? '100%' : 'auto' }}>
          {isSaving ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    </form>
  );
}
