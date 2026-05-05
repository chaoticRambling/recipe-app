import React, { useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableStepItem({ step, index, updateStep, removeStep, handleAutoResize }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style} className="editor-step-row">
      <div 
        {...attributes} 
        {...listeners} 
        style={{ cursor: 'grab', touchAction: 'none', padding: '0 8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
      >
        ⋮⋮
      </div>
      <span className="step-num-label">{step.step_number}.</span>
      <textarea 
        value={step.text} 
        onInput={handleAutoResize}
        onChange={(e) => updateStep(index, e.target.value)} 
        placeholder="Describe this step..."
        rows={2}
        className="step-textarea auto-resize"
      />
      <div className="step-file-upload">
        <input type="file" accept="image/*" />
      </div>
      <button type="button" onClick={() => removeStep(index)} className="remove-btn row-remove">X</button>
    </div>
  );
}

export default function StepEditor({ steps, setSteps }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    let needsUpdate = false;
    const newSteps = steps.map(step => {
      if (!step.id) {
        needsUpdate = true;
        return { ...step, id: crypto.randomUUID() };
      }
      return step;
    });
    if (needsUpdate) {
      setSteps(newSteps);
    }
  }, [steps, setSteps]);

  const handleAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const addStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, text: '', image_url: null, id: crypto.randomUUID() }]);
  };

  const updateStep = (index, text) => {
    const newSteps = [...steps];
    newSteps[index].text = text;
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index)
                          .map((step, i) => ({ ...step, step_number: i + 1 }));
    setSteps(newSteps);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(s => s.id === active.id);
      const newIndex = steps.findIndex(s => s.id === over.id);
      
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      const reindexedSteps = newSteps.map((step, i) => ({ ...step, step_number: i + 1 }));
      setSteps(reindexedSteps);
    }
  };

  return (
    <div className="step-editor">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map(s => s.id).filter(Boolean)} strategy={verticalListSortingStrategy}>
          {steps.map((step, idx) => step.id ? (
            <SortableStepItem 
              key={step.id} 
              step={step} 
              index={idx} 
              updateStep={updateStep} 
              removeStep={removeStep} 
              handleAutoResize={handleAutoResize}
            />
          ) : null)}
        </SortableContext>
      </DndContext>
      <button type="button" onClick={addStep} className="add-row-btn">+ Add Step</button>
    </div>
  );
}
