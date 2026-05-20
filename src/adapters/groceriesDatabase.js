import { supabase } from '../supabaseClient';

const LOCAL_ITEMS_KEY = 'recipe_app_grocery_items';
const LOCAL_USUAL_KEY = 'recipe_app_usual_purchases';

const DEFAULT_USUAL_PURCHASES = [
  { name: 'Soy Milk', default_aisle: 'Dairy/Alternative', default_store: "Trader Joe's" },
  { name: 'Extra Firm Tofu', default_aisle: 'Produce', default_store: "Trader Joe's" },
  { name: 'Apples', default_aisle: 'Produce', default_store: 'Whole Foods' },
  { name: 'Bread', default_aisle: 'Bakery', default_store: 'Local Market' }
];

// Helper to get local data
const getLocalData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Helper to save local data
const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- USUAL PURCHASES ---

export const getUsualPurchases = async (session) => {
  if (!session) {
    let localUsual = getLocalData(LOCAL_USUAL_KEY);
    if (!localUsual) {
      localUsual = DEFAULT_USUAL_PURCHASES.map((item, idx) => ({
        id: `local-usual-${idx}`,
        ...item,
        created_at: new Date().toISOString()
      }));
      setLocalData(LOCAL_USUAL_KEY, localUsual);
    }
    return localUsual;
  }

  // Supabase implementation
  try {
    const { data, error } = await supabase
      .from('usual_purchases')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Pre-seed if empty
    if (data.length === 0) {
      const seedData = DEFAULT_USUAL_PURCHASES.map(item => ({
        ...item,
        user_id: session.user.id
      }));
      const { data: inserted, error: insertError } = await supabase
        .from('usual_purchases')
        .insert(seedData)
        .select();

      if (insertError) throw insertError;
      return inserted;
    }

    return data;
  } catch (err) {
    console.error('Error getting usual purchases from Supabase:', err);
    return [];
  }
};

export const addUsualPurchase = async (session, purchase) => {
  if (!session) {
    const items = await getUsualPurchases(session);
    const newItem = {
      id: `local-usual-${Date.now()}`,
      name: purchase.name,
      default_aisle: purchase.default_aisle || '',
      default_store: purchase.default_store || '',
      created_at: new Date().toISOString()
    };
    setLocalData(LOCAL_USUAL_KEY, [...items, newItem]);
    return newItem;
  }

  try {
    const { data, error } = await supabase
      .from('usual_purchases')
      .insert([{
        name: purchase.name,
        default_aisle: purchase.default_aisle || '',
        default_store: purchase.default_store || '',
        user_id: session.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error adding usual purchase to Supabase:', err);
    throw err;
  }
};

export const deleteUsualPurchase = async (session, id) => {
  if (!session) {
    const items = await getUsualPurchases(session);
    setLocalData(LOCAL_USUAL_KEY, items.filter(item => item.id !== id));
    return;
  }

  try {
    const { error } = await supabase
      .from('usual_purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting usual purchase from Supabase:', err);
    throw err;
  }
};

// --- GROCERY ITEMS ---

export const getGroceryItems = async (session) => {
  if (!session) {
    const localItems = getLocalData(LOCAL_ITEMS_KEY);
    return localItems || [];
  }

  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error getting grocery items from Supabase:', err);
    return [];
  }
};

export const addGroceryItem = async (session, item) => {
  if (!session) {
    const items = await getGroceryItems(session);
    const newItem = {
      id: `local-item-${Date.now()}`,
      name: item.name,
      quantity: item.quantity || '',
      aisle: item.aisle || '',
      store: item.store || '',
      checked: false,
      created_at: new Date().toISOString()
    };
    setLocalData(LOCAL_ITEMS_KEY, [newItem, ...items]);
    return newItem;
  }

  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .insert([{
        name: item.name,
        quantity: item.quantity || '',
        aisle: item.aisle || '',
        store: item.store || '',
        checked: false,
        user_id: session.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error adding grocery item to Supabase:', err);
    throw err;
  }
};

export const updateGroceryItem = async (session, id, payload) => {
  if (!session) {
    const items = await getGroceryItems(session);
    const updated = items.map(item => {
      if (item.id === id) {
        const itemUpdated = { ...item, ...payload };
        if (payload.checked === true) {
          itemUpdated.bought_at = new Date().toISOString();
        } else if (payload.checked === false) {
          itemUpdated.bought_at = null;
        }
        return itemUpdated;
      }
      return item;
    });
    setLocalData(LOCAL_ITEMS_KEY, updated);
    return updated.find(item => item.id === id);
  }

  try {
    const updatePayload = { ...payload };
    if (payload.checked === true) {
      updatePayload.bought_at = new Date().toISOString();
    } else if (payload.checked === false) {
      updatePayload.bought_at = null;
    }

    const { data, error } = await supabase
      .from('grocery_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating grocery item on Supabase:', err);
    throw err;
  }
};

export const deleteGroceryItem = async (session, id) => {
  if (!session) {
    const items = await getGroceryItems(session);
    setLocalData(LOCAL_ITEMS_KEY, items.filter(item => item.id !== id));
    return;
  }

  try {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting grocery item from Supabase:', err);
    throw err;
  }
};

export const clearCheckedGroceryItems = async (session) => {
  if (!session) {
    const items = await getGroceryItems(session);
    const cleared = items.filter(item => !item.checked);
    setLocalData(LOCAL_ITEMS_KEY, cleared);
    return cleared;
  }

  try {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('checked', true);

    if (error) throw error;
  } catch (err) {
    console.error('Error clearing checked grocery items from Supabase:', err);
    throw err;
  }
};
