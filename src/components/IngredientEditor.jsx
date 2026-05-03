import React from 'react';

export default function IngredientEditor({ sections, setSections }) {
  const addSection = () => {
    setSections([...sections, { section_name: '', items: [] }]);
  };

  const updateSectionName = (index, name) => {
    const newSections = [...sections];
    newSections[index].section_name = name;
    setSections(newSections);
  };

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const addRow = (sectionIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].items.push({ amount: 1, unit: 'whole', name: '' });
    setSections(newSections);
  };

  const updateRow = (sectionIndex, itemIndex, field, value) => {
    const newSections = [...sections];
    if (field === 'amount') {
      newSections[sectionIndex].items[itemIndex][field] = parseFloat(value) || 0;
    } else {
      newSections[sectionIndex].items[itemIndex][field] = value;
    }
    setSections(newSections);
  };

  const removeRow = (sectionIndex, itemIndex) => {
    const newSections = [...sections];
    newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setSections(newSections);
  };

  return (
    <div className="ingredient-editor">
      <h3>Ingredients Structure</h3>
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="editor-section">
          <div className="section-header-edit">
            <input 
              type="text" 
              className="section-name-input"
              value={section.section_name} 
              onChange={(e) => updateSectionName(sIdx, e.target.value)} 
              placeholder="Section Name (e.g. 'Main', 'The Sauce')"
            />
            <button type="button" onClick={() => removeSection(sIdx)} className="remove-btn">Remove Section</button>
          </div>
          
          <div className="editor-items">
            {section.items.map((item, iIdx) => (
              <div key={iIdx} className="editor-item-row">
                <input 
                  type="number" 
                  step="0.1" 
                  className="amt-input"
                  value={item.amount} 
                  onChange={(e) => updateRow(sIdx, iIdx, 'amount', e.target.value)} 
                  placeholder="Amt"
                />
                <select 
                  className="unit-select"
                  value={item.unit} 
                  onChange={(e) => updateRow(sIdx, iIdx, 'unit', e.target.value)}
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
                  type="text" 
                  className="name-input"
                  value={item.name} 
                  onChange={(e) => updateRow(sIdx, iIdx, 'name', e.target.value)} 
                  placeholder="Ingredient name"
                />
                <button type="button" onClick={() => removeRow(sIdx, iIdx)} className="remove-btn row-remove">X</button>
              </div>
            ))}
            <button type="button" onClick={() => addRow(sIdx)} className="add-row-btn">+ Add Ingredient</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addSection} className="add-section-btn">+ Add New Section</button>
    </div>
  );
}
