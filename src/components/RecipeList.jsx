import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RecipeList.css';

export default function RecipeList({ recipes }) {
  const navigate = useNavigate();
  if (!recipes || recipes.length === 0) {
    return <div className="empty-state">No recipes found.</div>;
  }

  return (
    <div className="recipe-list-container">
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
          <div className="cell-title">{recipe.title || 'Untitled Recipe'}</div>
          
          <div className="cell-cuisine">
            {recipe.cuisine_type && (
              <span className="pill-cuisine">{recipe.cuisine_type}</span>
            )}
          </div>
          
          <div className="cell-time">
            <span className="pill-time">{recipe.prep_time_minutes} mins</span>
          </div>
          
          <div className="cell-action">
            <span className="chevron">&rsaquo;</span>
          </div>
        </div>
      ))}
    </div>
  );
}
