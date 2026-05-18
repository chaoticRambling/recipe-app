import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe, createRecipe, updateRecipe, uploadRecipeImage, deleteRecipe, deleteRecipeImage } from '../adapters/database';
import { importRecipeFromUrl } from '../adapters/importRecipe';
import imageCompression from 'browser-image-compression';
import Desktop95ScrollArea from '../components/Desktop95ScrollArea';
import IngredientEditor from '../components/IngredientEditor';
import StepEditor from '../components/StepEditor';
import { useTheme } from '../theme/useTheme';
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

const hasText = (value) => String(value ?? '').trim().length > 0;

const hasIngredientContent = (sections = []) => (
  sections.some((section, index) => {
    const sectionName = String(section.section_name || '').trim();
    const hasCustomSectionName = sectionName && (index !== 0 || sectionName !== 'Main');
    const hasItems = (section.items || []).some(item => (
      hasText(item.amount_text) ||
      hasText(item.amount) ||
      hasText(item.unit) ||
      hasText(item.name) ||
      hasText(item.original_text)
    ));

    return hasCustomSectionName || hasItems;
  })
);

const hasStepContent = (steps = []) => (
  steps.some(step => hasText(step.text) || hasText(step.image_url))
);

const buildImportedDraft = (recipe, sourceUrl) => {
  const importedRecipe = recipe || {};
  const now = new Date().toISOString();

  return {
    title: importedRecipe.title || 'Imported Recipe',
    prep_time_minutes: Number(importedRecipe.prep_time_minutes) || 0,
    cuisine_type: importedRecipe.cuisine_type || '',
    notes: importedRecipe.notes || '',
    ingredients: importedRecipe.ingredients || [{ section_name: 'Main', items: [] }],
    steps: importedRecipe.steps || [],
    draft_ingredients: importedRecipe.draft_ingredients || '',
    draft_steps: importedRecipe.draft_steps || '',
    is_draft: true,
    image_url: importedRecipe.image_url || null,
    source_url: sourceUrl,
    created_at: now,
    updated_at: now
  };
};

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  
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
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setSelectedImageFile(null);
      setLocalPreviewUrl(null);
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

  const hasManualRecipeInput = () => (
    hasText(title) ||
    hasText(prepTime) ||
    hasText(cuisine) ||
    hasText(notes) ||
    hasText(draftIngredients) ||
    hasText(draftSteps) ||
    hasIngredientContent(sections) ||
    hasStepContent(steps) ||
    Boolean(selectedImageFile)
  );

  const handleUrlImport = async (event) => {
    event.preventDefault();

    const trimmedUrl = importUrl.trim();
    if (!trimmedUrl) {
      setImportError('Enter a recipe URL to import.');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setImportError('Enter a full URL, including https://.');
      return;
    }

    if (hasManualRecipeInput()) {
      const shouldContinue = window.confirm(
        'Importing from a URL will create and open a separate draft. Unsaved edits on this page will be left behind. Continue?'
      );

      if (!shouldContinue) return;
    }

    setImportError('');
    setIsImporting(true);
    setImportProgress(8);
    setImportStatus('Fetching the recipe page...');

    try {
      const { recipe } = await importRecipeFromUrl(trimmedUrl);
      setImportProgress(90);
      setImportStatus('Creating draft recipe...');

      const savedRecipe = await createRecipe(buildImportedDraft(recipe, trimmedUrl));
      setImportProgress(100);
      setImportStatus('Draft ready. Opening editor...');
      setImportUrl('');
      navigate(`/editor/${savedRecipe.id}`);
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

  const editorForm = (
    <form className="recipe-editor-page" onSubmit={handleSave}>
      <header className="editor-header">
        <button type="button" className="nav-back-btn" onClick={() => navigate('/')}>
          &larr; Cancel
        </button>
        <h1>{id ? 'Edit Recipe' : 'New Recipe'}</h1>
        
        {/* Desktop Action Bar */}
        <div className="desktop-action-bar">
          {saveError && <span className="editor-save-error">{saveError}</span>}
          <label className="draft-toggle">
            <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
            Save as Draft
          </label>
          <button type="submit" className="save-btn" disabled={isSaving || isImporting}>
            {isSaving ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </header>

      {!id && (
        <section className="editor-import-panel" aria-labelledby="editor-import-title">
          <div className="editor-import-form">
            <div className="editor-import-copy">
              <h2 id="editor-import-title">Import From URL</h2>
              <p>Create a draft recipe from a webpage, then review it in the editor.</p>
            </div>
            <div className="editor-import-controls">
              <input
                type="url"
                value={importUrl}
                onChange={(event) => setImportUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleUrlImport(event);
                  }
                }}
                placeholder="https://example.com/recipe"
                disabled={isImporting}
                aria-label="Recipe URL"
              />
              <button type="button" onClick={handleUrlImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>

          {importError && (
            <p className="editor-import-message editor-import-error">{importError}</p>
          )}

          {(isImporting || importProgress > 0) && (
            <div className="editor-import-progress" role="status" aria-live="polite">
              <div className="editor-import-progress-row">
                <span>{importStatus || 'Importing recipe...'}</span>
                <span>{Math.round(importProgress)}%</span>
              </div>
              <div className="editor-import-progress-track" aria-hidden="true">
                <div
                  className="editor-import-progress-fill"
                  style={{ width: `${Math.min(importProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      <div className="editor-layout">
        {/* Left Pane - Drafts */}
        <div className="editor-left-pane">
          <section className="editor-section scratchpad-section">
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
          <div className="image-upload-section">
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
            >
              {(localPreviewUrl || existingImageUrl) ? (
                <img 
                  src={localPreviewUrl || existingImageUrl} 
                  alt="Recipe Preview" 
                  className="image-preview"
                />
              ) : (
                <span className="image-preview-placeholder">Tap to add photo</span>
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

          <div className="upload-photo-action">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="upload-photo-btn"
            >
              Upload / Replace Photo
            </button>
          </div>
        </div>
      </div>

      {id && (
        <div className="delete-recipe-action">
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={isSaving}
            className="delete-recipe-btn"
          >
            Delete Recipe
          </button>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      <div className={`mobile-sticky-action-bar ${saveError ? 'has-error' : ''}`}>
        {saveError ? (
          <div className="editor-save-error mobile-save-error">
            {saveError}
          </div>
        ) : (
          <label className="draft-toggle">
            <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
            Save as Draft
          </label>
        )}
        <button type="submit" className={`save-btn ${saveError ? 'save-btn-full' : ''}`} disabled={isSaving || isImporting}>
          {isSaving ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    </form>
  );

  if (activeTheme.id === 'desktop95') {
    return (
      <Desktop95ScrollArea
        className="editor-page-scroll"
        contentClassName="editor-page-scroll-content"
        scrollStep={240}
      >
        {editorForm}
      </Desktop95ScrollArea>
    );
  }

  return editorForm;
}
