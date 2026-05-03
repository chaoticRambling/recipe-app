**Step 12: Defensive Viewer & Scaling Updates**
*Prompt:* "Update `RecipeViewer.jsx` and `IngredientList.jsx` to be strictly defensive. 
- If `recipe.title` or `recipe.prep_time_minutes` are empty, display default fallback text (e.g., 'Untitled Recipe', '0 mins').
- If `recipe.ingredients` is empty, undefined, or missing a valid unit, the component must render safely without crashing. 
- Ensure the scaling buttons (0.5x, 1x, 2x) do nothing and throw no errors if the ingredients array is empty."

**Step 13: The Dynamic Input Components**
*Prompt:* "Create two form components for the editor:
1. `IngredientEditor.jsx`: This component manages an array of section objects. It must initialize with one default section named 'Main' (which the user can rename). Include a prominent 'Add New Section' button. Under each section, render rows for ingredients with manual text inputs for 'Amount' and 'Item', and a strictly enforced dropdown for 'Unit' (matching the volume/weight/discrete strings we defined earlier). Include 'Add Row' and 'Remove Row' buttons for the ingredients.
2. `StepEditor.jsx`: A simpler array manager for adding, editing, and removing text steps. Include a standard HTML `<input type='file' />` placeholder on each step row for future image uploads."

**Step 14: The Split-Pane Layout**
*Prompt:* "Create the `RecipeEditor.jsx` page. Implement a responsive layout:
- On mobile screens, show a single column layout defaulting to two large `<textarea>` fields for 'Draft Ingredients' and 'Draft Steps'. 
- On desktop screens (`min-width: 768px`), implement a split-pane layout using Flexbox or CSS Grid. The left pane holds the Draft textareas. The right pane contains standard inputs for Title, Prep Time, and Cuisine Type, followed by the `IngredientEditor` and `StepEditor` components.
- Add a main 'Save Recipe' button that compiles the state and calls `createRecipe(data)` or `updateRecipe(id, data)` from `database.js`, then uses `useNavigate` to return to the Dashboard."

**Step 15: Mocking the Save Action**
*Prompt:* "Update the `database.js` adapter. Implement the logic for `createRecipe(data)` and `updateRecipe(id, data)`. For now, `createRecipe` should generate a random ID, push the new recipe object to the local mock `recipes` array, and simulate a network delay before resolving. `updateRecipe` should find the existing ID in the array and overwrite it."