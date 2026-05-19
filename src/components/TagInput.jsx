import React, { useState, useEffect, useRef } from 'react';
import './TagInput.css';

export default function TagInput({ tags = [], onChange, suggestions = [] }) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsListRef = useRef(null);

  // Filter out suggestions that are already in active tags, and filter by input value
  const filteredSuggestions = suggestions.filter(suggestion => {
    const isAlreadySelected = tags.some(t => t.toLowerCase() === suggestion.toLowerCase());
    const matchesInput = suggestion.toLowerCase().includes(inputValue.toLowerCase());
    return !isAlreadySelected && matchesInput && inputValue.trim().length > 0;
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted suggestion index when user types or adds/removes tags
  useEffect(() => {
    setActiveIndex(-1);
  }, [inputValue, tags]);

  // Auto-scroll the highlighted suggestion into view if it gets cut off in the viewport
  useEffect(() => {
    if (activeIndex >= 0 && suggestionsListRef.current) {
      const activeEl = suggestionsListRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({
          block: 'nearest',
          behavior: 'auto'
        });
      }
    }
  }, [activeIndex]);

  const addTag = (tagText) => {
    const cleanTag = tagText.trim();
    if (!cleanTag) return;
    
    // Case-insensitive duplicate check
    const exists = tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
    if (!exists) {
      onChange([...tags, cleanTag]);
    }
    setInputValue('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      
      // If suggestions are open and an item is highlighted via keyboard, add it instead
      if (isOpen && activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[activeIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= filteredSuggestions.length) {
          return 0;
        }
        return nextIndex;
      });
    } else if (e.key === 'ArrowUp' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => {
        const nextIndex = prev - 1;
        if (nextIndex < 0) {
          return filteredSuggestions.length - 1;
        }
        return nextIndex;
      });
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    addTag(suggestion);
  };

  return (
    <div className="tag-input-container" ref={containerRef}>
      <div className="tag-input-field" onClick={() => inputRef.current?.focus()}>
        {tags.map((tag, idx) => (
          <span key={tag} className="tag-pill">
            <span className="tag-pill-text">{tag}</span>
            <button
              type="button"
              className="tag-pill-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
              title={`Remove ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={tags.length === 0 ? "e.g. breakfast, side, dip" : ""}
          className="tag-text-input"
        />
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <ul className="tag-suggestions-list" ref={suggestionsListRef}>
          {filteredSuggestions.map((suggestion, idx) => (
            <li
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`tag-suggestion-item ${idx === activeIndex ? 'active' : ''}`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
