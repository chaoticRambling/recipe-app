# Recipe App

A mobile-first, responsive recipe management application built with React, Vite, and Supabase. This app allows users to view, manage, and intricately edit recipes, featuring a robust drag-and-drop interface for organizing ingredients and steps.

## Features
- **Authentication**: Secure login and user session management powered by Supabase.
- **Dashboard**: View your library of recipes at a glance.
- **URL Import**: Create a draft recipe from a webpage URL using recipe metadata first, with optional LLM fallback.
- **Theme Skins**: Switch between code-authored visual skins, including a `Desktop 95` proof theme with sharp corners, bevels, and CSS-generated texture.
- **Recipe Viewer**: An elegant, mobile-friendly interface for cooking and reading recipes.
- **Explore View**: Search and filter your recipe box using dynamic tag buttons (strict "AND" intersection compounding logic) combined with type-ahead keyword search matching across Titles, Ingredients, and Steps.
- **Advanced Recipe Editor**: 
  - Drag-and-drop reordering using `@dnd-kit`.
  - Sortable ingredient lists that can be nested into categories (e.g., "Main", "Sauce").
  - Auto-expanding, sortable instruction steps designed to maximize typing space on both mobile and desktop views.
  - **Dynamic Multi-Tagging Input**: Converts the standard "Cuisine Type" field into an interactive tag pill system, supporting auto-suggestions for previously used tags, keyboard ArrowDown/ArrowUp navigation, and comma/Enter key tag creation.

## File Structure

The `src` directory is organized modularly to separate concerns between full-page layouts and interactive components:

```
src/
├── App.jsx / main.jsx       # Application entry point and routing setup
├── index.css / App.css      # Global styles and design tokens
├── supabaseClient.js        # Supabase client initialization
├── theme/                   # Theme catalog, runtime provider, and skin tokens
│
├── pages/                   # Full-page routing views
│   ├── LoginView.jsx        # Authentication view
│   ├── DashboardView.jsx    # Recipe library overview
│   ├── ExploreView.jsx      # Tag explorer and text keyword search view
│   ├── RecipeViewer.jsx     # Read-only cooking view
│   └── RecipeEditor.jsx     # Complex creation and editing environment
│
├── components/              # Reusable, interactive UI elements
│   ├── AppNavigation.jsx    # Unified theme-sensitive header-tabs and bottom-nav component
│   ├── ThemeSwitcher.jsx    # Theme selector UI
│   ├── SettingsMenu.jsx     # Settings popover with theme controls
│   ├── Desktop95ScrollArea.jsx # Custom chunky scroll area for Desktop 95
│   ├── TagInput.jsx         # Keyboard-navigable multi-tag input with auto-suggestions
│   ├── IngredientEditor.jsx # Drag-and-drop ingredient sections
│   ├── StepEditor.jsx       # Sortable and auto-expanding instruction steps
│   ├── IngredientList.jsx   # Read-only ingredient display
│   └── RecipeList.jsx       # Component for rendering lists of recipes
│
├── adapters/                # Data transformation layer (Supabase to Frontend)
└── utils/                   # Generic helper functions
```

## Theme System Notes

Themes are code-authored presets defined in `src/theme/themeCatalog.js` and styled through CSS custom properties in `src/theme/themes.css`. The app applies the active skin by setting `data-theme` on the document root through `ThemeProvider`.

Themes can also declare lightweight chrome metadata through `uiChrome`. `Desktop 95` uses this to request a window frame, top tabs, decorative window controls, and chunky scrollbar styling. Non-retro themes keep the regular page frame and bottom navigation.

Desktop 95 uses `src/components/Desktop95ScrollArea.jsx` for its app-like scroll regions instead of relying only on browser-native scrollbar styling. Recipe viewer, editor, and explore pages get a right-hand Windows-95-style page scrollbar inside the faux window so bottom content remains reachable. To support smooth scrolling without nested double-scrollbar clipping, the Explore page's results list shell and matching container are designed with minimum height rules (`min-height: 260px` for `.recipe-list-shell` and `330px` for `.explore-results-container`), guaranteeing at least three recipe cards render fully inside the retro box without squishing. Ingredients and instructions keep their own fixed-height inset scroll panes inside the recipe viewer.

The theme layer now has two levels of tokens:

- Compatibility tokens such as `--bg-primary`, `--accent-color`, and `--radius-lg`.
- Component-level skin tokens such as `--skin-control-bg`, `--skin-panel-border`, `--skin-inset-shadow`, `--radius-control`, and `--radius-card`.

Desktop-style chrome uses additional tokens such as `--skin-window-bg`, `--skin-titlebar-bg`, `--skin-window-control-shadow`, `--skin-tab-bg`, and `--skin-scrollbar-thumb-bg`.

The custom Desktop 95 scrollbar thumb supports hover, active, and click-drag interactions. Keep active/drag selectors scoped to the scroll area that owns the thumb, because recipe pages can nest ingredient/instruction scroll panes inside the full-page scroll pane.

Prefer the component-level skin tokens when styling UI surfaces. They support full `background` values, so a theme can use flat colors, gradients, bevels, inset shadows, and generated textures. `Desktop 95` is the current proof theme for this deeper skinning model.

`Desktop 95` also has replaceable PNG placeholders in `public/` for visual polish:

- `desktop95-chef-placeholder.png`: dashboard welcome avatar beside `Welcome back, Chef!`.
- `desktop95-dashboard-icon.png`: small icon before the `My Recipes` dashboard heading.

Keep the same filenames when replacing these assets. Square PNGs work best; the CSS uses pixelated rendering for the retro look.

Theme choice is persisted immediately in `localStorage` and synced to Supabase for authenticated users through `public.user_preferences.theme_id`.

For deeper context before continuing theme work, see `planning/theme_handoff.md`.

## Backend Configuration (Supabase)

This project relies on Supabase for its backend database and authentication.
To run the app locally, create a `.env.local` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

URL imports preserve the original webpage in a `source_url` column. Apply the SQL in `planning/url_import_schema.sql` to add it.

Theme selection is stored locally for immediate reloads and synced to Supabase for authenticated users. Apply the SQL in `planning/theme_preferences_schema.sql` to create the `user_preferences` table and ownership-aware RLS policies.

## URL Import Configuration

The URL importer runs as a Netlify Function at `/.netlify/functions/import-recipe-url`.

It first tries to parse `schema.org/Recipe` JSON-LD from the webpage. If no recipe metadata is available, it can fall back to OpenAI structured extraction when these Netlify environment variables are set:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_RECIPE_IMPORT_MODEL=gpt-5-nano
```

For local function testing, run the app through Netlify Dev rather than plain Vite so `/.netlify/functions/*` routes are available.

## Deployment (Netlify)

This app is designed to be easily deployed to Netlify as a standard Vite single-page application.

**Netlify Build Settings:**
- **Framework:** Vite
- **Build command:** `npm run build`
- **Publish directory:** `dist`

Ensure that you add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Netlify Environment Variables in the site settings. If routing fails upon refresh, you may need a `_redirects` file in your `public` directory containing `/* /index.html 200` to support React Router.

### Bundle Performance & Optimization

The initial application bundle is optimized using route-level code-splitting and lazy-loading via `React.lazy` and `React.Suspense`. 

The `RecipeEditor` route is loaded asynchronously, isolating large third-party libraries (specifically `@dnd-kit` and `browser-image-compression`) into a separate dedicated chunk. This drops the main entry bundle size down to ~392 kB, well below Vite's default 500 kB warning threshold, ensuring rapid initial page loads and reduced startup memory consumption.
