# Recipe App

A mobile-first, responsive recipe management application built with React, Vite, and Supabase. This app allows users to view, manage, and intricately edit recipes, featuring a robust drag-and-drop interface for organizing ingredients and steps.

## Features
- **Authentication**: Secure login and user session management powered by Supabase.
- **Dashboard**: View your library of recipes at a glance.
- **Recipe Viewer**: An elegant, mobile-friendly interface for cooking and reading recipes.
- **Advanced Recipe Editor**: 
  - Drag-and-drop reordering using `@dnd-kit`.
  - Sortable ingredient lists that can be nested into categories (e.g., "Main", "Sauce").
  - Auto-expanding, sortable instruction steps designed to maximize typing space on both mobile and desktop views.

## File Structure

The `src` directory is organized modularly to separate concerns between full-page layouts and interactive components:

```
src/
├── App.jsx / main.jsx       # Application entry point and routing setup
├── index.css / App.css      # Global styles and design tokens
├── supabaseClient.js        # Supabase client initialization
│
├── pages/                   # Full-page routing views
│   ├── LoginView.jsx        # Authentication view
│   ├── DashboardView.jsx    # Recipe library overview
│   ├── RecipeViewer.jsx     # Read-only cooking view
│   └── RecipeEditor.jsx     # Complex creation and editing environment
│
├── components/              # Reusable, interactive UI elements
│   ├── IngredientEditor.jsx # Drag-and-drop ingredient sections
│   ├── StepEditor.jsx       # Sortable and auto-expanding instruction steps
│   ├── IngredientList.jsx   # Read-only ingredient display
│   └── RecipeList.jsx       # Component for rendering lists of recipes
│
├── adapters/                # Data transformation layer (Supabase to Frontend)
└── utils/                   # Generic helper functions
```

## Backend Configuration (Supabase)

This project relies on Supabase for its backend database and authentication.
To run the app locally, create a `.env.local` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment (Netlify)

This app is designed to be easily deployed to Netlify as a standard Vite single-page application.

**Netlify Build Settings:**
- **Framework:** Vite
- **Build command:** `npm run build`
- **Publish directory:** `dist`

Ensure that you add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Netlify Environment Variables in the site settings. If routing fails upon refresh, you may need a `_redirects` file in your `public` directory containing `/* /index.html 200` to support React Router.
