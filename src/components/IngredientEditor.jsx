import React, { useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
        type="number" step="0.1" className="amt-input"
        value={item.amount} onChange={(e) => updateRow(sectionIndex, itemIndex, 'amount', e.target.value)} 
        placeholder="Amt"
      />
      <select 
        className="unit-select" value={item.unit} onChange={(e) => updateRow(sectionIndex, itemIndex, 'unit', e.target.value)}
      >
        <optgroup label="Volume">
          <option value="tsp">tsp</option>
          <option value="tbsp">tbsp</option>
          <option value="fl oz">fl oz</option>
          <option value="cup">cup</option>
          <option value="pt">pt</option>
          <option value="qt">qt</option>
        </optgroup>
        <optgroup label="Weight">
          <option value="g">g</option>
          <option value="oz">oz</option>
          <option value="lb">lb</option>
        </optgroup>
        <optgroup label="Discrete">
          <option value="whole">whole</option>
          <option value="clove">clove</option>
          <option value="pinch">pinch</option>
          <option value="handful">handful</option>
          <option value="can">can</option>
        </optgroup>
      </select>
      <input 
        type="text" className="name-input" value={item.name} 
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
        if (!item.id) {
          secUpdated = true;
          return { ...item, id: crypto.randomUUID() };
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
      newSections[sectionIndex].items.push({ amount: 1, unit: 'whole', name: '', id: crypto.randomUUID() });
      return newSections;
    });
  };

  const updateRow = (sectionIndex, itemIndex, field, value) => {
    setSections(prev => {
      const newSections = JSON.parse(JSON.stringify(prev));
      if (field === 'amount') {
        newSections[sectionIndex].items[itemIndex][field] = parseFloat(value) || 0;
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
