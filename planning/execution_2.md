**Step 5: Expanding the Mock Data**
*Prompt:* "Update the `database.js` file. Expand the `getRecipes()` mock data to return an array of at least 5 different recipes with varying `title`, `cuisine_type`, and `prep_time_minutes` so I can test list rendering."

**Step 6: The Compact List Component**
*Prompt:* "Create a React component called `RecipeList.jsx`. It should take an array of `recipes` as a prop. Render this data as a clean, highly compact table or flexbox list. Show only the `title`, `cuisine_type`, and `prep_time_minutes`. Ensure each row has a clear hover state and acts as a clickable target (use a simple `console.log('Navigate to', recipe.id)` for the click handler for now). Do not include any thumbnail images."

**Step 7: The Dashboard View**
*Prompt:* "Create the `DashboardView.jsx` page. It should call `getRecipes()` from `database.js` on mount and store the result in state. Render a clean page header with a 'New Recipe' button, and below that, render the `RecipeList` component, passing in the fetched data."