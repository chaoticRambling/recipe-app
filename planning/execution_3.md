**Step 8: The Nervous System (Routing)**
*Prompt:* "Now that the core views are built, let's wire them together using `react-router-dom`. 

First, provide the terminal command to install the router package. 

Next, rewrite `App.jsx` to implement a `BrowserRouter` with the following route structure:
- `/` -> Renders `DashboardView`
- `/recipe/:id` -> Renders `RecipeViewer`
- `/editor` -> Renders `RecipeEditor` (for creating a new recipe)
- `/editor/:id` -> Renders `RecipeEditor` (for updating an existing recipe)

Finally, update the `RecipeList.jsx` component we built earlier. Remove the `console.log` placeholder and replace it with React Router navigation (using `useNavigate` or `<Link>`) so that clicking a recipe row properly navigates the user to `/recipe/${recipe.id}`."