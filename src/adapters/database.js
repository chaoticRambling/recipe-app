import { supabase } from '../supabaseClient';

export const getRecipes = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
  return data;
};

export const getRecipe = async (id) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
  return data;
};

export const updateRecipe = async (id, payload) => {
  const { data, error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
  return data;
};

export const createRecipe = async (payload) => {
  const { data, error } = await supabase
    .from('recipes')
    .insert([payload])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
  return data;
};

export const uploadRecipeImage = async (file, recipeId) => {
  if (!file) return null;
  const fileNameStr = file.name || 'image.jpeg';
  const fileExt = fileNameStr.split('.').pop();
  const fileName = `${recipeId}-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const deleteRecipeImage = async (imageUrl) => {
  if (!imageUrl) return;
  const urlParts = imageUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  const { error } = await supabase.storage
    .from('recipe-images')
    .remove([fileName]);
    
  if (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const deleteRecipe = async (id) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};
