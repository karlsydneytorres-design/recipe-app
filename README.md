# Recipe Manager & Meal Planner

Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Quick Start

```bash
# 1. Install dependencies
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query react-hook-form zod @hookform/resolvers date-fns lucide-react clsx tailwind-merge

# 2. Fill in .env.local with your Supabase keys

# 3. Run schema.sql in Supabase SQL Editor

# 4. Start dev server
npm run dev
```

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **State / Data**: TanStack React Query
- **Forms**: React Hook Form + Zod

## Pages
- `/recipes` — browse and search recipes
- `/recipes/new` — add a new recipe
- `/recipes/[id]` — view recipe detail
- `/recipes/[id]/edit` — edit a recipe
- `/planner` — weekly meal planner calendar
- `/shopping` — auto-generated shopping list
