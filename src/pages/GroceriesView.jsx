import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavigation from '../components/AppNavigation';
import Desktop95ScrollArea from '../components/Desktop95ScrollArea';
import { useTheme } from '../theme/useTheme';
import { usesTopTabs } from '../theme/themeCatalog';
import {
  getGroceryItems,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  clearCheckedGroceryItems,
  getUsualPurchases,
  addUsualPurchase,
  deleteUsualPurchase
} from '../adapters/groceriesDatabase';
import './GroceriesView.css';

export default function GroceriesView({ session }) {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const useTopTabs = usesTopTabs(activeTheme);

  // Tab state: 'planning' | 'shopping' | 'usual' | 'history'
  const [activeTab, setActiveTab] = useState('planning');

  // Database lists
  const [items, setItems] = useState([]);
  const [usualPurchases, setUsualPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Undo stack
  const [undoStack, setUndoStack] = useState([]);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  // Form states (Planning List Builder)
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [aisle, setAisle] = useState('');
  const [store, setStore] = useState("Trader Joe's");
  const [aisleSuggestions, setAisleSuggestions] = useState([]);
  const [showAisleSuggestions, setShowAisleSuggestions] = useState(false);
  const [activeAisleSuggestionIndex, setActiveAisleSuggestionIndex] = useState(-1);
  const [showUsualSuggestions, setShowUsualSuggestions] = useState(false);
  const [activeUsualSuggestionIndex, setActiveUsualSuggestionIndex] = useState(-1);

  // Form states (Usual Purchases Manager)
  const [usualName, setUsualName] = useState('');
  const [usualAisle, setUsualAisle] = useState('');
  const [usualStore, setUsualStore] = useState("Trader Joe's");
  const [showUsualAisleSuggestions, setShowUsualAisleSuggestions] = useState(false);
  const [activeUsualAisleSuggestionIndex, setActiveUsualAisleSuggestionIndex] = useState(-1);

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editAisle, setEditAisle] = useState('');
  const [editStore, setEditStore] = useState('');

  // Stores Catalog (editable by user, persisted locally)
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('recipe_app_stores');
    return saved ? JSON.parse(saved) : ["Trader Joe's", "Whole Foods", "Costco", "Local Market"];
  });
  const [newStoreName, setNewStoreName] = useState('');
  const [showAddStore, setShowAddStore] = useState(false);

  // Collapsible aisles in shopping mode
  const [collapsedAisles, setCollapsedAisles] = useState({});

  // Initialize data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedItems, loadedUsual] = await Promise.all([
          getGroceryItems(session),
          getUsualPurchases(session)
        ]);
        setItems(loadedItems);
        setUsualPurchases(loadedUsual);

        // Harvest unique aisles for autocomplete suggestions
        const uniqueAisles = new Set([
          ...loadedItems.map(i => i.aisle).filter(Boolean),
          ...loadedUsual.map(u => u.default_aisle).filter(Boolean),
          'Produce', 'Dairy/Alternative', 'Bakery', 'Frozen', 'Pantry', 'Meat', 'Seafood', 'Beverages'
        ]);
        setAisleSuggestions(Array.from(uniqueAisles));
      } catch (err) {
        console.error('Failed to load groceries data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session]);

  // Handle adding store
  const handleAddStore = () => {
    if (!newStoreName.trim()) return;
    if (stores.includes(newStoreName.trim())) return;
    const updated = [...stores, newStoreName.trim()];
    setStores(updated);
    localStorage.setItem('recipe_app_stores', JSON.stringify(updated));
    setStore(newStoreName.trim());
    setNewStoreName('');
    setShowAddStore(false);
  };

  // Push to undo stack
  const pushToUndo = (action) => {
    setUndoStack(prev => [action, ...prev].slice(0, 15)); // Cap stack at 15
    
    // Set message
    let msg = '';
    if (action.type === 'ADD') msg = `Added "${action.item.name}"`;
    else if (action.type === 'CHECK') msg = `Checked off "${action.item.name}"`;
    else if (action.type === 'UNCHECK') msg = `Re-added "${action.item.name}"`;
    else if (action.type === 'DELETE') msg = `Deleted "${action.item.name}"`;
    else if (action.type === 'CLEAR_CHECKED') msg = `Cleared ${action.items.length} items`;
    
    setLastActionMessage(msg);
    setShowUndoToast(true);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowUndoToast(false);
    }, 6000);
  };

  // Perform Undo
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const [action, ...restStack] = undoStack;
    setUndoStack(restStack);
    setShowUndoToast(false);

    try {
      if (action.type === 'ADD') {
        // Revert ADD: Delete the added item
        await deleteGroceryItem(session, action.item.id);
        setItems(prev => prev.filter(i => i.id !== action.item.id));
      } else if (action.type === 'DELETE') {
        // Revert DELETE: Re-add the item
        const restored = await addGroceryItem(session, action.item);
        setItems(prev => [restored, ...prev]);
      } else if (action.type === 'CHECK') {
        // Revert CHECK: Uncheck item
        const restored = await updateGroceryItem(session, action.item.id, { checked: false });
        setItems(prev => prev.map(i => i.id === action.item.id ? restored : i));
      } else if (action.type === 'UNCHECK') {
        // Revert UNCHECK: Check item
        const restored = await updateGroceryItem(session, action.item.id, { checked: true });
        setItems(prev => prev.map(i => i.id === action.item.id ? restored : i));
      } else if (action.type === 'CLEAR_CHECKED') {
        // Revert CLEAR_CHECKED: Restore all cleared items
        const restoredItems = [];
        for (const item of action.items) {
          const restored = await addGroceryItem(session, item);
          restoredItems.push(restored);
        }
        setItems(prev => [...restoredItems, ...prev]);
      }
    } catch (err) {
      console.error('Failed to undo action:', err);
    }
  };

  // Compute matched usual purchases based on name typed
  const matchedUsuals = name.trim()
    ? usualPurchases.filter(u => u.name.toLowerCase().includes(name.toLowerCase()))
    : [];

  // Handle keyboard navigation for usual purchases dropdown
  const handleUsualKeyDown = (e) => {
    if (!showUsualSuggestions || matchedUsuals.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveUsualSuggestionIndex(prev =>
        prev < matchedUsuals.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveUsualSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setShowUsualSuggestions(false);
      setActiveUsualSuggestionIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeUsualSuggestionIndex >= 0 && activeUsualSuggestionIndex < matchedUsuals.length) {
        e.preventDefault();
        const selected = matchedUsuals[activeUsualSuggestionIndex];
        selectUsualSuggestion(selected);
      }
    }
  };

  const selectUsualSuggestion = (usual) => {
    setName(usual.name);
    if (usual.default_aisle) setAisle(usual.default_aisle);
    if (usual.default_store) setStore(usual.default_store);
    setShowUsualSuggestions(false);
    setActiveUsualSuggestionIndex(-1);
  };

  // Compute matched aisle suggestions for the List Builder
  const filteredAisles = aisleSuggestions.filter(s =>
    s.toLowerCase().includes(aisle.toLowerCase())
  );

  // Handle keyboard navigation for List Builder aisle suggestions dropdown
  const handleAisleKeyDown = (e) => {
    if (!showAisleSuggestions || filteredAisles.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveAisleSuggestionIndex(prev =>
        prev < filteredAisles.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveAisleSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setShowAisleSuggestions(false);
      setActiveAisleSuggestionIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeAisleSuggestionIndex >= 0 && activeAisleSuggestionIndex < filteredAisles.length) {
        e.preventDefault();
        const selectedAisle = filteredAisles[activeAisleSuggestionIndex];
        setAisle(selectedAisle);
        setShowAisleSuggestions(false);
        setActiveAisleSuggestionIndex(-1);
      }
    }
  };

  // Compute matched aisle suggestions for the usual purchases catalog manager
  const filteredUsualAisles = aisleSuggestions.filter(s =>
    s.toLowerCase().includes(usualAisle.toLowerCase())
  );

  // Handle keyboard navigation for usual aisle suggestions dropdown
  const handleUsualAisleKeyDown = (e) => {
    if (!showUsualAisleSuggestions || filteredUsualAisles.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveUsualAisleSuggestionIndex(prev =>
        prev < filteredUsualAisles.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveUsualAisleSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setShowUsualAisleSuggestions(false);
      setActiveUsualAisleSuggestionIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeUsualAisleSuggestionIndex >= 0 && activeUsualAisleSuggestionIndex < filteredUsualAisles.length) {
        e.preventDefault();
        const selectedAisle = filteredUsualAisles[activeUsualAisleSuggestionIndex];
        setUsualAisle(selectedAisle);
        setShowUsualAisleSuggestions(false);
        setActiveUsualAisleSuggestionIndex(-1);
      }
    }
  };

  // Handle adding an item
  const handleAddItem = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    try {
      const newItem = await addGroceryItem(session, {
        name: name.trim(),
        quantity: quantity.trim(),
        aisle: aisle.trim(),
        store: store
      });

      setItems(prev => [newItem, ...prev]);
      pushToUndo({ type: 'ADD', item: newItem });

      // Clean form fields
      setName('');
      setQuantity('');
      setAisle('');
      
      // Update autocomplete dynamic list
      if (aisle.trim() && !aisleSuggestions.includes(aisle.trim())) {
        setAisleSuggestions(prev => [...prev, aisle.trim()]);
      }
    } catch (err) {
      console.error('Error adding grocery item:', err);
    }
  };

  // Quick populate from usual purchases
  const handleQuickAdd = async (usual) => {
    try {
      const newItem = await addGroceryItem(session, {
        name: usual.name,
        quantity: '',
        aisle: usual.default_aisle || '',
        store: usual.default_store || store
      });
      setItems(prev => [newItem, ...prev]);
      pushToUndo({ type: 'ADD', item: newItem });
    } catch (err) {
      console.error('Error quick-adding usual purchase:', err);
    }
  };

  // Toggle item checked state
  const handleToggleChecked = async (item) => {
    const nextState = !item.checked;
    try {
      const updated = await updateGroceryItem(session, item.id, { checked: nextState });
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      pushToUndo({ type: nextState ? 'CHECK' : 'UNCHECK', item: updated });
    } catch (err) {
      console.error('Error toggling checked state:', err);
    }
  };

  // Clear single checked item (archiving it to history)
  const handleClearItem = async (item) => {
    try {
      await deleteGroceryItem(session, item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      pushToUndo({ type: 'DELETE', item: item });
    } catch (err) {
      console.error('Error archiving single item:', err);
    }
  };

  // Archive all checked items
  const handleClearChecked = async () => {
    const checkedItems = items.filter(i => i.checked);
    if (checkedItems.length === 0) return;

    try {
      await clearCheckedGroceryItems(session);
      setItems(prev => prev.filter(i => !i.checked));
      pushToUndo({ type: 'CLEAR_CHECKED', items: checkedItems });
    } catch (err) {
      console.error('Error clearing checked items:', err);
    }
  };

  // Inline edit init
  const startEditing = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditQuantity(item.quantity || '');
    setEditAisle(item.aisle || '');
    setEditStore(item.store || stores[0]);
  };

  // Inline edit save
  const saveEditing = async (id) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateGroceryItem(session, id, {
        name: editName.trim(),
        quantity: editQuantity.trim(),
        aisle: editAisle.trim(),
        store: editStore
      });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
      setEditingItemId(null);
    } catch (err) {
      console.error('Error saving item edit:', err);
    }
  };

  // Delete active item
  const handleDeleteItem = async (item) => {
    try {
      await deleteGroceryItem(session, item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      pushToUndo({ type: 'DELETE', item: item });
    } catch (err) {
      console.error('Error deleting grocery item:', err);
    }
  };

  // Manage Usual Purchases form submit
  const handleAddUsual = async (e) => {
    e.preventDefault();
    if (!usualName.trim()) return;

    try {
      const newUsual = await addUsualPurchase(session, {
        name: usualName.trim(),
        default_aisle: usualAisle.trim(),
        default_store: usualStore
      });
      setUsualPurchases(prev => [...prev, newUsual]);
      
      if (usualAisle.trim() && !aisleSuggestions.includes(usualAisle.trim())) {
        setAisleSuggestions(prev => [...prev, usualAisle.trim()]);
      }
      
      setUsualName('');
      setUsualAisle('');
    } catch (err) {
      console.error('Error adding usual purchase:', err);
    }
  };

  // Delete usual purchase
  const handleDeleteUsual = async (id) => {
    try {
      await deleteUsualPurchase(session, id);
      setUsualPurchases(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error deleting usual purchase:', err);
    }
  };

  // Helper to group items by Store -> Aisle
  const getGroupedItems = (unboughtOnly = false) => {
    const list = unboughtOnly ? items.filter(i => !i.checked) : items;
    const groups = {};

    list.forEach(item => {
      const storeName = item.store || 'Unassigned Store';
      const aisleName = item.aisle || 'General';

      if (!groups[storeName]) groups[storeName] = {};
      if (!groups[storeName][aisleName]) groups[storeName][aisleName] = [];
      groups[storeName][aisleName].push(item);
    });

    return groups;
  };

  // Toggle collapsed aisle state in shopping mode
  const toggleAisleCollapse = (store, aisle) => {
    const key = `${store}-${aisle}`;
    setCollapsedAisles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Split active items into unbought and recently bought
  const activeUnbought = items.filter(i => !i.checked);
  const activeBought = items.filter(i => i.checked);

  // Render tab content based on active selection
  const renderTabContent = () => {
    if (loading) {
      return <div className="loader">Loading your grocery list...</div>;
    }

    switch (activeTab) {
      case 'planning':
        return (
          <div className="groceries-planning-panel">
            {/* Left Form Panel */}
            <div className="groceries-planning-controls">
              <form onSubmit={handleAddItem} className="win95-form-group groceries-form">
                <div className="form-row">
                  <div className="field-group flex-2 suggestion-container">
                    <label htmlFor="item-name">Add Grocery Item</label>
                    <input
                      id="item-name"
                      type="text"
                      className="win95-input text-input"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setShowUsualSuggestions(true);
                        setActiveUsualSuggestionIndex(-1);
                      }}
                      onKeyDown={handleUsualKeyDown}
                      onBlur={() => setTimeout(() => setShowUsualSuggestions(false), 250)}
                      placeholder="e.g. Soy Milk"
                      required
                      autoComplete="off"
                    />
                    {showUsualSuggestions && matchedUsuals.length > 0 && (
                      <div className="usual-suggestions-popup">
                        {matchedUsuals.map((u, idx) => (
                          <button
                            key={u.id}
                            type="button"
                            className={`suggestion-item ${idx === activeUsualSuggestionIndex ? 'active' : ''}`}
                            onMouseDown={() => selectUsualSuggestion(u)}
                          >
                            <strong>{u.name}</strong> <small>({u.default_aisle || 'General'})</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="field-group flex-1">
                    <label htmlFor="item-quantity">Qty / Unit</label>
                    <input
                      id="item-quantity"
                      type="text"
                      className="win95-input text-input"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 2 ct"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field-group flex-1 suggestion-container">
                    <label htmlFor="item-aisle">Aisle</label>
                    <input
                      id="item-aisle"
                      type="text"
                      className="win95-input text-input"
                      value={aisle}
                      onChange={(e) => {
                        setAisle(e.target.value);
                        setShowAisleSuggestions(true);
                        setActiveAisleSuggestionIndex(-1);
                      }}
                      onFocus={() => {
                        setShowAisleSuggestions(true);
                        setActiveAisleSuggestionIndex(-1);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAisleSuggestions(false), 200);
                        setActiveAisleSuggestionIndex(-1);
                      }}
                      onKeyDown={handleAisleKeyDown}
                      placeholder="e.g. Produce"
                      autoComplete="off"
                    />
                    {showAisleSuggestions && filteredAisles.length > 0 && (
                      <div className="aisle-suggestions-popup">
                        {filteredAisles
                          .slice(0, 5)
                          .map((s, index) => (
                            <button
                              key={s}
                              type="button"
                              className={`suggestion-item ${index === activeAisleSuggestionIndex ? 'active' : ''}`}
                              onMouseDown={() => {
                                setAisle(s);
                                setShowAisleSuggestions(false);
                                setActiveAisleSuggestionIndex(-1);
                              }}
                            >
                              {s}
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <div className="field-group flex-1">
                    <label htmlFor="item-store">Store Location</label>
                    <div className="store-select-wrapper">
                      <select
                        id="item-store"
                        className="win95-input select-input"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                      >
                        {stores.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="win95-btn add-store-trigger"
                        onClick={() => setShowAddStore(!showAddStore)}
                        title="Add Custom Store"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {showAddStore && (
                  <div className="add-store-panel win95-inset-pane">
                    <label htmlFor="new-store-name">Custom Store Name</label>
                    <div className="add-store-row">
                      <input
                        id="new-store-name"
                        type="text"
                        className="win95-input text-input"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        placeholder="e.g. Safeway"
                      />
                      <button type="button" className="win95-btn" onClick={handleAddStore}>Add</button>
                    </div>
                  </div>
                )}

                <button type="submit" className="win95-btn submit-btn">
                  Add Item to List
                </button>
              </form>

              {/* Usual Purchases Quick Select */}
              <div className="usual-purchases-quick-bar win95-inset-pane">
                <h4>⭐ Usual Purchases</h4>
                <p className="quick-help">Tap to instantly add items to active list:</p>
                <div className="usual-tags-wrapper">
                  {usualPurchases.length === 0 ? (
                    <span className="usual-empty-placeholder">No usual purchases found. Manage them in the Usual tab!</span>
                  ) : (
                    usualPurchases.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className="usual-tag-pill"
                        onClick={() => handleQuickAdd(u)}
                      >
                        +{u.name} <small>({u.default_aisle || 'General'})</small>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Table Panel */}
            <div className="groceries-list-table-wrapper win95-inset-pane">
              <h3>Active Grocery List ({activeUnbought.length} items)</h3>
              
              {items.length === 0 ? (
                <div className="empty-list-placeholder">
                  <p>Your grocery list is empty.</p>
                  <p className="small">Use the builder or Usual Purchases above to draft your trip!</p>
                </div>
              ) : (
                <div className="planning-list-scroller">
                  {Object.entries(getGroupedItems()).map(([storeName, aisleMap]) => (
                    <div key={storeName} className="store-grouping-panel">
                      <h4 className="store-group-header">🏪 {storeName}</h4>
                      <div className="store-group-content">
                        {Object.entries(aisleMap).map(([aisleName, aisleItems]) => (
                          <div key={aisleName} className="aisle-grouping-pane">
                            <h5 className="aisle-group-header">📍 {aisleName}</h5>
                            <table className="win95-table groceries-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '45%' }}>Item Name</th>
                                  <th style={{ width: '20%' }}>Quantity</th>
                                  <th style={{ width: '35%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {aisleItems.map(item => (
                                  <tr key={item.id} className={item.checked ? 'row-checked' : ''}>
                                    {editingItemId === item.id ? (
                                      <>
                                        <td>
                                          <input
                                            type="text"
                                            className="win95-input inline-edit-input"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="text"
                                            className="win95-input inline-edit-input"
                                            value={editQuantity}
                                            onChange={(e) => setEditQuantity(e.target.value)}
                                          />
                                        </td>
                                        <td>
                                          <div className="inline-action-buttons">
                                            <button className="win95-btn inline-btn success" onClick={() => saveEditing(item.id)}>Save</button>
                                            <button className="win95-btn inline-btn" onClick={() => setEditingItemId(null)}>Cancel</button>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="item-name-cell">
                                          <span className="item-name-text">{item.name}</span>
                                        </td>
                                        <td>{item.quantity || '--'}</td>
                                        <td>
                                          <div className="row-action-buttons">
                                            <button className="win95-btn inline-btn" onClick={() => startEditing(item)}>Edit</button>
                                            <button className="win95-btn inline-btn danger" onClick={() => handleDeleteItem(item)}>Delete</button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'shopping':
        return (
          <div className="groceries-shopping-panel">
            <header className="shopping-controls-header">
              <h3>🏪 Shopping Assistant</h3>
              <div className="shopping-meta-stats">
                <span>Total Active: <strong>{activeUnbought.length}</strong></span>
                <span>Bought: <strong>{activeBought.length}</strong></span>
                {activeBought.length > 0 && (
                  <button className="win95-btn clear-checked-btn danger" onClick={handleClearChecked}>
                    Clear Finished Items
                  </button>
                )}
              </div>
            </header>

            {activeUnbought.length === 0 && activeBought.length === 0 ? (
              <div className="empty-list-placeholder">
                <p>No active items on your list.</p>
                <button className="win95-btn" onClick={() => setActiveTab('planning')}>
                  Go to List Builder
                </button>
              </div>
            ) : (
              <div className="shopping-mode-scroller win95-inset-pane">
                {/* 1. Unbought Grouped Items */}
                {activeUnbought.length === 0 ? (
                  <div className="shopping-trip-completed-banner">
                    <h3>🎉 All done! Excellent shopping trip!</h3>
                    <p>All items checked off. Ready to head home!</p>
                  </div>
                ) : (
                  Object.entries(getGroupedItems(true)).map(([storeName, aisleMap]) => (
                    <div key={storeName} className="shopping-store-card">
                      <h4 className="shopping-store-title">🏪 {storeName}</h4>
                      
                      {Object.entries(aisleMap).map(([aisleName, aisleItems]) => {
                        const isCollapsed = collapsedAisles[`${storeName}-${aisleName}`];
                        return (
                          <div key={aisleName} className="shopping-aisle-panel">
                            <h5
                              className="shopping-aisle-title clickable"
                              onClick={() => toggleAisleCollapse(storeName, aisleName)}
                            >
                              <span>📍 {aisleName} <small>({aisleItems.length} items)</small></span>
                              <span className="collapse-arrow">{isCollapsed ? '▲' : '▼'}</span>
                            </h5>

                            {!isCollapsed && (
                              <ul className="shopping-checkbox-list">
                                {aisleItems.map(item => (
                                  <li key={item.id} className="shopping-item-row">
                                    <label className="shopping-checkbox-label">
                                      <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleToggleChecked(item)}
                                      />
                                      <span className="shopping-item-name">{item.name}</span>
                                      {item.quantity && <span className="shopping-item-qty">({item.quantity})</span>}
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}

                {/* 2. Recently Bought Section (Option A: Stays visible but dimmed) */}
                {activeBought.length > 0 && (
                  <div className="shopping-recently-bought-panel">
                    <h4 className="bought-section-header">✓ Recently Checked Items</h4>
                    <p className="clear-helper-text">Tap a checkmark to archive/clear the item permanently from this list:</p>
                    <ul className="shopping-checkbox-list bought-items-list">
                      {activeBought.map(item => (
                        <li key={item.id} className="shopping-item-row bought-item-row">
                          <label className="shopping-checkbox-label strike-through">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleChecked(item)}
                            />
                            <span className="shopping-item-name">{item.name}</span>
                            {item.quantity && <span className="shopping-item-qty">({item.quantity})</span>}
                          </label>
                          <button
                            type="button"
                            className="win95-btn inline-btn clear-cell-trigger"
                            onClick={() => handleClearItem(item)}
                            title="Clear Item permanently"
                          >
                            Clear
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'usual':
        return (
          <div className="groceries-usual-panel">
            <div className="usual-form-wrapper">
              <form onSubmit={handleAddUsual} className="win95-form-group usual-form">
                <h3>⭐ Manage Usual Purchases Catalog</h3>
                <p className="panel-desc">Define standard purchases you buy regularly to keep them ready for quick-adding.</p>

                <div className="form-row">
                  <div className="field-group flex-2">
                    <label htmlFor="usual-name">Item Name</label>
                    <input
                      id="usual-name"
                      type="text"
                      className="win95-input text-input"
                      value={usualName}
                      onChange={(e) => setUsualName(e.target.value)}
                      placeholder="e.g. Extra Firm Tofu"
                      required
                    />
                  </div>
                  <div className="field-group flex-1 suggestion-container">
                    <label htmlFor="usual-aisle">Default Aisle</label>
                    <input
                      id="usual-aisle"
                      type="text"
                      className="win95-input text-input"
                      value={usualAisle}
                      onChange={(e) => {
                        setUsualAisle(e.target.value);
                        setShowUsualAisleSuggestions(true);
                        setActiveUsualAisleSuggestionIndex(-1);
                      }}
                      onFocus={() => {
                        setShowUsualAisleSuggestions(true);
                        setActiveUsualAisleSuggestionIndex(-1);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowUsualAisleSuggestions(false), 200);
                        setActiveUsualAisleSuggestionIndex(-1);
                      }}
                      onKeyDown={handleUsualAisleKeyDown}
                      placeholder="e.g. Produce"
                      autoComplete="off"
                    />
                    {showUsualAisleSuggestions && filteredUsualAisles.length > 0 && (
                      <div className="aisle-suggestions-popup">
                        {filteredUsualAisles.map((s, index) => (
                          <button
                            key={s}
                            type="button"
                            className={`suggestion-item ${index === activeUsualAisleSuggestionIndex ? 'active' : ''}`}
                            onMouseDown={() => {
                              setUsualAisle(s);
                              setShowUsualAisleSuggestions(false);
                              setActiveUsualAisleSuggestionIndex(-1);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="field-group flex-1">
                    <label htmlFor="usual-store">Default Store Location</label>
                    <select
                      id="usual-store"
                      className="win95-input select-input"
                      value={usualStore}
                      onChange={(e) => setUsualStore(e.target.value)}
                    >
                      {stores.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="win95-btn submit-btn">
                  Save Usual Purchase
                </button>
              </form>

              {/* Manage Custom Stores Panel */}
              <div className="manage-stores-card win95-inset-pane">
                <h4>🏬 Manage Custom Stores List</h4>
                <ul className="win95-bullet-list stores-bullet-list">
                  {stores.map((s, idx) => (
                    <li key={s} className="store-bullet-item">
                      <span>{s}</span>
                      {stores.length > 1 && (
                        <button
                          type="button"
                          className="bullet-delete-trigger"
                          onClick={() => {
                            const updated = stores.filter(storeName => storeName !== s);
                            setStores(updated);
                            localStorage.setItem('recipe_app_stores', JSON.stringify(updated));
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* List Catalog Table */}
            <div className="groceries-list-table-wrapper catalog-table win95-inset-pane">
              <h3>Catalog Reference List ({usualPurchases.length} items)</h3>
              <table className="win95-table usual-catalog-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Default Aisle</th>
                    <th>Default Store</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usualPurchases.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.default_aisle || '--'}</td>
                      <td>{u.default_store || '--'}</td>
                      <td>
                        <button className="win95-btn inline-btn danger" onClick={() => handleDeleteUsual(u.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Base Retro Layout (desktop95)
  const retroLayout = (
    <div className="groceries-view retro-groceries-view">
      <header className="dashboard-header settings-header-nav">
        <h1>Groceries System Properties</h1>
      </header>

      {useTopTabs && <AppNavigation />}

      <main className="dashboard-main settings-main">
        <Desktop95ScrollArea
          className="settings-page-scroll"
          contentClassName="settings-page-scroll-content"
          scrollStep={240}
        >
          <div className="win95-dialog win95-grocery-dialog">
            {/* Dialog tabs */}
            <nav className="win95-tabs win95-grocery-tabs" role="tablist">
              <button
                type="button"
                className={`win95-tab ${activeTab === 'planning' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'planning'}
                onClick={() => setActiveTab('planning')}
              >
                List Builder
              </button>
              <button
                type="button"
                className={`win95-tab ${activeTab === 'shopping' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'shopping'}
                onClick={() => setActiveTab('shopping')}
              >
                Shopping
              </button>
              <button
                type="button"
                className={`win95-tab ${activeTab === 'usual' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'usual'}
                onClick={() => setActiveTab('usual')}
              >
                Usual Catalog
              </button>
            </nav>

            {/* Dialog panel content */}
            <div className="win95-tab-content win95-grocery-content" role="tabpanel">
              {renderTabContent()}
            </div>

            {/* Undo Toast overlay */}
            {showUndoToast && (
              <div className="win95-dialog-buttons win95-undo-toast">
                <span className="undo-msg">🗂️ {lastActionMessage}</span>
                <button type="button" className="win95-btn undo-btn" onClick={handleUndo}>
                  Undo Action
                </button>
              </div>
            )}
          </div>
        </Desktop95ScrollArea>
      </main>

      {useTopTabs && <div style={{ height: 'var(--spacing-md)' }} />}
    </div>
  );

  // Base Modern/Classic Layout
  const modernLayout = (
    <div className="groceries-view modern-groceries-view">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Groceries Management</h1>
          <div className="header-actions">
            {['planning', 'shopping', 'usual'].map(tabName => (
              <button
                key={tabName}
                className={`modern-tab-btn ${activeTab === tabName ? 'active' : ''}`}
                onClick={() => setActiveTab(tabName)}
              >
                {tabName === 'planning' && '📝 Builder'}
                {tabName === 'shopping' && '🧺 Shop'}
                {tabName === 'usual' && '⭐ Usuals'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="dashboard-main settings-main">
        <div className="modern-groceries-container groceries-container">
          <section className="modern-settings-content-card groceries-content-card">
            {renderTabContent()}

            {/* Floating Undo toast */}
            {showUndoToast && (
              <div className="modern-feedback-toast groceries-undo-toast">
                <span>🗂️ {lastActionMessage}</span>
                <button className="modern-btn-primary undo-trigger-btn" onClick={handleUndo}>
                  Undo
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {!useTopTabs && <AppNavigation />}
    </div>
  );

  return activeTheme.id === 'desktop95' ? retroLayout : modernLayout;
}
