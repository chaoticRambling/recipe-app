import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../adapters/database';
import RecipeList from '../components/RecipeList';
import './DashboardView.css';

export default function DashboardView() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard-view">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>My Recipes</h1>
          <button className="new-recipe-btn" onClick={() => navigate('/editor')}>
            + New Recipe
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <div className="loader">Loading recipes...</div>
        ) : (
          <RecipeList recipes={recipes} />
        )}
      </main>
    </div>
  );
}
