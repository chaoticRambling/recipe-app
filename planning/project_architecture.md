# Project Architecture: Personal Recipe App

## Core Philosophy
- **Zero Lock-In:** Data must be easily exportable via standard protocols.
- **Set It & Forget It:** Maximize free tiers, minimize maintenance.
- **Clean Separation:** UI must be completely decoupled from the database service.

## Tech Stack
- **Frontend Framework:** React (via Vite)
- **Backend / Database:** Supabase (Open-source PostgreSQL)
- **Hosting:** Netlify or Vercel
- **Authentication:** Supabase Magic Links (Passwordless, single-admin access)

## The Adapter Pattern
- No Supabase SDK code is allowed inside React UI components.
- All database interactions must happen through a single `database.js` adapter file.
- If Supabase is ever abandoned, only `database.js` needs to be rewritten.