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
      <table className="recipe-list-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Cuisine</th>
            <th className="right-align">Prep Time</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => (
            <tr 
              key={recipe.id} 
              className="recipe-row"
              onClick={() => navigate('/recipe/' + recipe.id)}
            >
              <td className="recipe-title">{recipe.title}</td>
              <td>
                <span className="recipe-cuisine">{recipe.cuisine_type}</span>
              </td>
              <td className="right-align recipe-time">
                {recipe.prep_time_minutes} mins
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
