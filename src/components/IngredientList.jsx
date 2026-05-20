import React from 'react';
import Desktop95ScrollArea from './Desktop95ScrollArea';
import { formatIngredientParts, shouldFlagUnscaledIngredient } from '../utils/scalingMath';
import './IngredientList.css';

export default function IngredientList({ sections, multiplier, selectable = false, selectedItems = {}, onToggleItem }) {
  if (!sections || sections.length === 0) {
    return <p>No ingredients available.</p>;
  }

  return (
    <Desktop95ScrollArea className="ingredient-list" contentClassName="ingredient-list-content">
      {sections.map((section, idx) => (
        <div key={idx} className="ingredient-section">
          {section.section_name && <h3 className="section-title">{section.section_name}</h3>}
          <ul className="ingredient-items">
            {section.items && section.items.map((item, itemIdx) => {
              if (!item || (!item.name && !item.original_text)) return null;
              const safeMultiplier = multiplier && !isNaN(multiplier) ? multiplier : 1;
              const { quantity, name } = formatIngredientParts(item, safeMultiplier);
              const isUnscaled = shouldFlagUnscaledIngredient(item, safeMultiplier);
              const itemKey = `${idx}-${itemIdx}`;
              const isChecked = !!selectedItems[itemKey];

              const handleToggle = (e) => {
                if (selectable && onToggleItem) {
                  onToggleItem(itemKey, { name: name || item.original_text, quantity });
                }
              };

              return (
                <li 
                  key={itemIdx} 
                  className={`ingredient-item ${isUnscaled ? 'ingredient-item-unscaled' : ''} ${selectable ? 'ingredient-item-selectable' : ''} ${isChecked ? 'ingredient-item-checked' : ''}`}
                  onClick={selectable ? handleToggle : undefined}
                  style={selectable ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                >
                  {selectable && (
                    <input 
                      type="checkbox" 
                      className="ingredient-item-checkbox" 
                      checked={isChecked}
                      onChange={handleToggle}
                      onClick={(e) => e.stopPropagation()} // prevent double toggle on li click
                      style={{ marginRight: 'var(--spacing-sm)' }}
                    />
                  )}
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
    </Desktop95ScrollArea>
  );
}
