import React from 'react';
import { normalizeAndScale } from '../utils/scalingMath';
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
              if (!item || !item.unit) return null; // Safe rendering guard
              const safeMultiplier = multiplier && !isNaN(multiplier) ? multiplier : 1;
              const scaled = normalizeAndScale(item, safeMultiplier);
              return (
                <li key={itemIdx} className="ingredient-item">
                  <span className="ingredient-amount">
                    {scaled.amount} {scaled.unit}
                  </span>
                  <span className="ingredient-name">{scaled.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
