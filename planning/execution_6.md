**Step 16: Supabase Client & Authentication**
*Prompt:* "We are replacing our mock data with a real Supabase backend. 
1. Provide the terminal command to install `@supabase/supabase-js`.
2. Create a `src/supabaseClient.js` file. Initialize the client using `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
3. Create a `LoginView.jsx` page. It needs a clean, simple UI with an email input and a 'Send Magic Link' button. It should call `supabase.auth.signInWithOtp({ email })`. Display a success message telling the user to check their email after clicking.
4. Update `App.jsx` to include the `/login` route."

**Step 17: Route Protection & Session Management**
*Prompt:* "Update `App.jsx` to manage the Supabase authentication state.
1. Use `supabase.auth.getSession()` on mount to check if a user is currently logged in, and set up a listener using `supabase.auth.onAuthStateChange()` to keep the state synced.
2. Create a protected route wrapper or logic that checks this state: if a user is NOT logged in, any attempt to visit `/editor` or `/editor/:id` must automatically redirect them to `/login`.
3. Add a simple 'Log Out' button to the `DashboardView` (only visible if the user is authenticated) that calls `supabase.auth.signOut()`."

**Step 18: The Great Database Swap (The Adapter)**
*Prompt:* "Rewrite our `database.js` adapter file. Remove all mock data arrays and fake timeout delays. Replace the functions with real Supabase SDK calls using our `supabaseClient.js`.
- `getRecipes()`: Call `supabase.from('recipes').select('*').order('updated_at', { ascending: false })`.
- `getRecipeById(id)`: Fetch a single record matching the ID. Return `null` if no record is found.
- `createRecipe(data)`: Insert the data into the 'recipes' table and return the new record.
- `updateRecipe(id, data)`: Update the existing record matching the ID.
Ensure these functions return the data in the exact same JSON structures as our mock data so none of our UI components break."

**Step 19: Editor Polish & Draft Status**
*Prompt:* "Update the `RecipeEditor.jsx` component to handle the Supabase integration. 
1. Add a 'Publish Status' toggle or checkbox to the form that maps to the `is_draft` boolean in our database schema (defaulting to true). 
2. Ensure that when the 'Save Recipe' button is clicked, the `is_draft` status is passed along with the structured ingredients and steps to `createRecipe` or `updateRecipe`.
3. Ensure the `DashboardView` fetches the updated list of recipes automatically after a save."