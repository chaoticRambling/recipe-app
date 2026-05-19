import React from 'react';
import { useNavigate } from 'react-router-dom';
import Desktop95ScrollArea from './Desktop95ScrollArea';
import { useTheme } from '../theme/useTheme';
import './RecipeList.css';

export default function RecipeList({ recipes }) {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  if (!recipes || recipes.length === 0) {
    return <div className="empty-state">No recipes found.</div>;
  }

  return (
    <Desktop95ScrollArea className="recipe-list-shell" contentClassName="recipe-list-container">
      <div className="recipe-list-header">
        <div>Title</div>
        <div>Cuisine</div>
        <div style={{ textAlign: 'right' }}>Prep Time</div>
        <div></div>
      </div>
      
      {recipes.map((recipe) => (
        <div 
          key={recipe.id} 
          className="recipe-card"
          onClick={() => navigate('/recipe/' + recipe.id)}
        >
          <div className="recipe-card-image" style={{ backgroundImage: `url('${recipe.image_url || activeTheme.assets.recipeHero}')` }} />
          <div className="recipe-card-content">
            <div className="cell-title">{recipe.title || 'Untitled Recipe'}</div>
            
            <div className="recipe-card-footer">
              <div className="cell-cuisine">
                {recipe.is_draft && (
                  <span className="pill-draft">Draft</span>
                )}
                {recipe.cuisine_type &&
                  recipe.cuisine_type.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="pill-cuisine">{tag}</span>
                  ))
                }
              </div>
              
              <div className="cell-time">
                <span className="pill-time">{recipe.prep_time_minutes} mins</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </Desktop95ScrollArea>
  );
}
