# UI & UX Specifications

## Authentication & Access
- **Admin View:** Accessed via Magic Link to an email address. Grants access to the `RecipeEditor`.
- **Public View:** Read-only access via a shareable link. Cannot edit recipes.

## Data Entry Workflow
1. **Mobile "Quick Draft":** Two massive `<textarea>` fields (Ingredients Dump, Steps Dump). Saves with `is_draft: true`.
2. **Desktop "Command Center":** Split-pane layout. Left side shows raw draft text. Right side features `DynamicListInput` to build the strict JSONB structures before publishing.

## Mobile Viewer (Cooking Mode)
- Integrates the native web `WakeLock` API to prevent the screen from sleeping.
- Features high-contrast text and massive tap targets for dirty hands.
- Includes a `StepByStepToggle` to switch between a condensed list and a single-step focus mode.

## Ingredient Scaling Logic
- **Architecture:** "Normalize -> Multiply -> Format" pipeline.
- **Base Units:** Code normalizes volumes to `tsp` and weights to `g` before applying the multiplier, then formats to the largest whole unit (e.g., 6 tsp renders as 2 tbsp).
- **Enforced Dropdowns:** To guarantee math works, the Unit input field is strictly locked to specific strings:
  - *Volume:* tsp, tbsp, fl oz, cup, pt, qt
  - *Weight:* g, oz, lb
  - *Discrete:* whole, clove, pinch, handful, can