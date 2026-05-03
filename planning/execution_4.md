<!-- execution_4.md -->

**Step 9: The Smart Adapter Logic**
*Prompt:* "Update the `database.js` file. Modify the `getRecipeById(id)` function. Instead of returning a hardcoded recipe, it should now search the mock `recipes` array (created in Step 5) using `Array.prototype.find()`. 
- If a recipe with the matching string `id` is found, return it.
- If no recipe is found, return `null`.
- Maintain the simulated network delay (e.g., `setTimeout`) to keep testing the loading states."

**Step 10: Graceful Error Handling in the UI**
*Prompt:* "Update the `RecipeViewer.jsx` component to handle the new `database.js` logic. 
- When the component mounts, extract the `id` from the URL using React Router's `useParams`.
- Fetch the data. If `getRecipeById` returns `null`, update the state to reflect that the recipe does not exist.
- If the recipe does not exist, render a clean '404: Recipe Not Found' fallback UI with a button or link that uses React Router to navigate back to the Dashboard (`/`)."