import React from 'react';

export default function StepEditor({ steps, setSteps }) {
  const addStep = () => {
    setSteps([...steps, { step_number: steps.length + 1, text: '', image_url: null }]);
  };

  const updateStep = (index, text) => {
    const newSteps = [...steps];
    newSteps[index].text = text;
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index)
                          .map((step, i) => ({ ...step, step_number: i + 1 })); // Re-index
    setSteps(newSteps);
  };

  return (
    <div className="step-editor">
      <h3>Steps Structure</h3>
      {steps.map((step, idx) => (
        <div key={idx} className="editor-step-row">
          <span className="step-num-label">{step.step_number}.</span>
          <textarea 
            value={step.text} 
            onChange={(e) => updateStep(idx, e.target.value)} 
            placeholder="Describe this step..."
            rows={2}
            className="step-textarea"
          />
          <div className="step-file-upload">
            <input type="file" accept="image/*" />
          </div>
          <button type="button" onClick={() => removeStep(idx)} className="remove-btn row-remove">X</button>
        </div>
      ))}
      <button type="button" onClick={addStep} className="add-row-btn">+ Add Step</button>
    </div>
  );
}
