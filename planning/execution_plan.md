# Agentic Coding Prompt Sequence

**Rule: Do not ask the AI to build the app at once. Proceed in this exact order.**

1. **The Adapter:** "Create a React `database.js` adapter file with empty placeholder functions for CRUD operations. Return mock data that perfectly matches this JSON schema: [Insert Schema]. Do not write actual Supabase logic yet."
2. **The Math Engine:** "Write a pure JavaScript `scalingMath.js` utility. It takes an ingredient object (amount, unit, name) and a multiplier. It normalizes US volume measurements to teaspoons, multiplies, and formats them back cleanly. Write unit tests."
3. **The Dumb UI:** "Create an `IngredientList.jsx` component. It takes a `sections` array and a `multiplier` prop. It uses `scalingMath.js` to render the correct amounts in an HTML list."
4. **The Smart State:** "Create the `RecipeViewer` page. Fetch a recipe using `database.js`, store it in state, and implement a row of multiplier buttons (0.5x, 1x, 2x) that pass the multiplier down to the `IngredientList`."