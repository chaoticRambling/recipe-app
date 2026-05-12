import React, { useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseStrictNumber } from '../utils/scalingMath';

const UNIT_SUGGESTIONS = [
  'tsp',
  'tbsp',
  'fl oz',
  'cup',
  'pt',
  'qt',
  'g',
  'oz',
  'lb',
  'whole',
  'clove',
  'pinch',
  'handful',
  'can',
  'sprig',
  'bunch',
  'sheet',
  'packet',
  'jar'
];

function getAmountInputValue(item) {
  if (item.amount_text !== undefined && item.amount_text !== null) {
    return item.amount_text;
  }

  return item.amount ?? '';
}

function SortableIngredientItem({ item, sectionIndex, itemIndex, updateRow, removeRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style} className="editor-item-row">
      <div 
        {...attributes} 
        {...listeners} 
        style={{ cursor: 'grab', touchAction: 'none', padding: '0 8px', color: 'var(--text-secondary)' }}
      >
        ⋮⋮
      </div>
      <input 
        type="text" className="amt-input"
        value={getAmountInputValue(item)}
        onChange={(e) => updateRow(sectionIndex, itemIndex, 'amount_text', e.target.value)} 
        placeholder="Amt"
      />
      <input
        type="text"
        className="unit-input"
        list="ingredient-unit-suggestions"
        value={item.unit || ''}
        onChange={(e) => updateRow(sectionIndex, itemIndex, 'unit', e.target.value)}
        placeholder="Unit"
      />
      <input 
        type="text" className="name-input" value={item.name || ''} 
        onChange={(e) => updateRow(sectionIndex, itemIndex, 'name', e.target.value)} 
        placeholder="Ingredient name"
      />
      <button type="button" onClick={() => removeRow(sectionIndex, itemIndex)} className="remove-btn row-remove">X</button>
    </div>
  );
}

function SortableSection({ section, sectionIndex, updateSectionName, removeSection, addRow, updateRow, removeRowFromSection }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 2 : 0,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} className="editor-section" style={{ ...style, padding: 'var(--spacing-md)' }}>
      <div className="section-header-edit">
        <div 
          {...attributes} 
          {...listeners} 
          style={{ cursor: 'grab', touchAction: 'none', padding: '0 8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
        >
          ⋮⋮
        </div>
        <input 
          type="text" className="section-name-input" value={section.section_name} 
          onChange={(e) => updateSectionName(sectionIndex, e.target.value)} 
          placeholder="Section Name (e.g. 'Main', 'The Sauce')"
        />
        <button type="button" onClick={() => removeSection(sectionIndex)} className="remove-btn row-remove" title="Remove Section">X</button>
      </div>
      
      <div className="editor-items">
        <SortableContext items={section.items.map(i => i.id).filter(Boolean)} strategy={verticalListSortingStrategy}>
          {section.items.map((item, iIdx) => item.id ? (
            <SortableIngredientItem 
              key={item.id} 
              item={item} 
              sectionIndex={sectionIndex} 
              itemIndex={iIdx} 
              updateRow={updateRow} 
              removeRow={removeRowFromSection} 
            />
          ) : null)}
        </SortableContext>
        <button type="button" onClick={() => addRow(sectionIndex)} className="add-row-btn">+ Add Ingredient</button>
      </div>
    </div>
  );
}

export default function IngredientEditor({ sections, setSections }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    let needsUpdate = false;
    const newSections = sections.map(sec => {
      let secUpdated = false;
      let newSec = { ...sec };
      if (!newSec.id) {
        newSec.id = crypto.randomUUID();
        secUpdated = true;
      }
      const newItems = newSec.items.map(item => {
        const amount = parseStrictNumber(item.amount_text) ?? parseStrictNumber(item.amount);
        const amountText = item.amount_text ?? (amount !== null ? String(amount) : '');
        const scalable = item.scalable ?? (amount !== null);
        const normalizedItem = {
          ...item,
          amount,
          amount_text: amountText,
          unit: item.unit || '',
          name: item.name || '',
          original_text: item.original_text || '',
          scalable
        };

        if (!item.id) {
          secUpdated = true;
          return { ...normalizedItem, id: crypto.randomUUID() };
        }

        if (
          item.amount !== normalizedItem.amount ||
          item.amount_text !== normalizedItem.amount_text ||
          item.unit !== normalizedItem.unit ||
          item.name !== normalizedItem.name ||
          item.original_text !== normalizedItem.original_text ||
          item.scalable !== normalizedItem.scalable
        ) {
          secUpdated = true;
          return normalizedItem;
        }

        return item;
      });
      if (secUpdated) {
        needsUpdate = true;
        newSec.items = newItems;
      }
      return newSec;
    });
    if (needsUpdate) {
      setSections(newSections);
    }
  }, [sections, setSections]);

  const addSection = () => {
    setSections(prev => [...prev, { section_name: '', items: [], id: crypto.randomUUID() }]);
  };

  const updateSectionName = (index, name) => {
    setSections(prev => {
      const newSections = JSON.parse(JSON.stringify(prev));
      newSections[index].section_name = name;
      return newSections;
    });
  };

  const removeSection = (index) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const addRow = (sectionIndex) => {
    setSections(prev => {
      const newSections = JSON.parse(JSON.stringify(prev));
      newSections[sectionIndex].items.push({
        amount: null,
        amount_text: '',
        unit: '',
        name: '',
        original_text: '',
        scalable: false,
        id: crypto.randomUUID()
      });
      return newSections;
    });
  };

  const updateRow = (sectionIndex, itemIndex, field, value) => {
    setSections(prev => {
      const newSections = JSON.parse(JSON.stringify(prev));
      if (field === 'amount_text') {
        const amount = parseStrictNumber(value);
        newSections[sectionIndex].items[itemIndex].amount_text = value;
        newSections[sectionIndex].items[itemIndex].amount = amount;
        newSections[sectionIndex].items[itemIndex].scalable = amount !== null;
      } else {
        newSections[sectionIndex].items[itemIndex][field] = value;
      }
      return newSections;
    });
  };

  const removeRowFromSection = (sectionIndex, itemIndex) => {
    setSections(prev => {
      const newSections = JSON.parse(JSON.stringify(prev));
      newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
      return newSections;
    });
  };

  const findContainer = (id) => {
    if (sections.find(s => s.id === id)) return id; // It's a section
    for (let s of sections) {
      if (s.items.find(i => i.id === id)) return s.id;
    }
    return null;
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // If dragging a Section itself, do not execute item dragOver logic
    if (activeId === activeContainer) {
      return;
    }

    setSections((prev) => {
      const activeSectionIndex = prev.findIndex(s => s.id === activeContainer);
      const overSectionIndex = prev.findIndex(s => s.id === overContainer);

      const activeItemIndex = prev[activeSectionIndex].items.findIndex(i => i.id === activeId);
      const overItemIndex = prev[overSectionIndex].items.findIndex(i => i.id === overId);

      const newSections = JSON.parse(JSON.stringify(prev));
      const [movedItem] = newSections[activeSectionIndex].items.splice(activeItemIndex, 1);
      
      if (overId === overContainer) {
        newSections[overSectionIndex].items.push(movedItem);
      } else {
        const insertIndex = overItemIndex >= 0 ? overItemIndex : newSections[overSectionIndex].items.length;
        newSections[overSectionIndex].items.splice(insertIndex, 0, movedItem);
      }
      
      return newSections;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    // Moving a Section
    if (activeContainer === activeId) {
      const oldIndex = sections.findIndex(s => s.id === activeId);
      const newIndex = sections.findIndex(s => s.id === overContainer);
      if (oldIndex !== newIndex) {
        setSections(arrayMove(sections, oldIndex, newIndex));
      }
      return;
    }

    // Moving an Item within the same section
    if (activeContainer === overContainer) {
      const sectionIndex = sections.findIndex(s => s.id === activeContainer);
      const oldIndex = sections[sectionIndex].items.findIndex(i => i.id === activeId);
      const newIndex = sections[sectionIndex].items.findIndex(i => i.id === overId);

      if (oldIndex !== newIndex) {
        const newSections = [...sections];
        newSections[sectionIndex].items = arrayMove(newSections[sectionIndex].items, oldIndex, newIndex);
        setSections(newSections);
      }
    }
  };

  return (
    <div className="ingredient-editor">
      <datalist id="ingredient-unit-suggestions">
        {UNIT_SUGGESTIONS.map(unit => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map(s => s.id).filter(Boolean)} strategy={verticalListSortingStrategy}>
          {sections.map((section, sIdx) => section.id ? (
            <SortableSection 
              key={section.id} 
              section={section} 
              sectionIndex={sIdx} 
              updateSectionName={updateSectionName} 
              removeSection={removeSection} 
              addRow={addRow} 
              updateRow={updateRow} 
              removeRowFromSection={removeRowFromSection} 
            />
          ) : null)}
        </SortableContext>
      </DndContext>
      <button type="button" onClick={addSection} className="add-section-btn">+ Add New Section</button>
    </div>
  );
}
