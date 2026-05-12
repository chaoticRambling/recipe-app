import React from 'react';
import { formatIngredientParts, shouldFlagUnscaledIngredient } from '../utils/scalingMath';
import './IngredientList.css';

export default function IngredientList({ sections, multiplier }) {
  if (!sections || sections.length === 0) {
    return <p>No ingredients available.</p>;
  }

  return (
    <div className="ingredient-list">
      {sections.map((section, idx) => (
        <div key={idx} className="ingredient-section">
          {section.section_name && <h3 className="section-title">{section.section_name}</h3>}
          <ul className="ingredient-items">
            {section.items && section.items.map((item, itemIdx) => {
              if (!item || (!item.name && !item.original_text)) return null;
              const safeMultiplier = multiplier && !isNaN(multiplier) ? multiplier : 1;
              const { quantity, name } = formatIngredientParts(item, safeMultiplier);
              const isUnscaled = shouldFlagUnscaledIngredient(item, safeMultiplier);
              return (
                <li key={itemIdx} className={`ingredient-item ${isUnscaled ? 'ingredient-item-unscaled' : ''}`}>
                  {quantity && (
                    <span className="ingredient-amount">
                      {quantity}
                    </span>
                  )}
                  <span className="ingredient-name">{name || item.original_text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
