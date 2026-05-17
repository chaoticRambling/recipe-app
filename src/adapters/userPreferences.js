import { supabase } from '../supabaseClient';
import { normalizeThemeId } from '../theme/themeCatalog';

export const getUserThemePreference = async (userId) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user theme preference:', error);
    return null;
  }

  return data?.theme_id ? normalizeThemeId(data.theme_id) : null;
};

export const saveUserThemePreference = async (userId, themeId) => {
  if (!userId) return null;

  const payload = {
    user_id: userId,
    theme_id: normalizeThemeId(themeId),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving user theme preference:', error);
    return null;
  }

  return data;
};
