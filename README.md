# Lumio

**Your own school. Your own teacher. Your own way.**

A personal AI school for children and teenagers. This repository is **Step 1**: the
website foundation — landing page, authentication, onboarding, a protected student
dashboard, and the initial database. The AI teacher, lessons, voice and tests are
intentionally **not** built yet; where they'll appear, the UI shows clear
"Coming soon" placeholders.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — authentication + Postgres database (with Row Level Security)
- **Cloudflare Workers** deployment via **@opennextjs/cloudflare**
- Self-hosted fonts (Fraunces + Inter) — no runtime Google Fonts dependency

## Routes

| Route         | Purpose                          | Protected |
| ------------- | -------------------------------- | --------- |
| `/`           | Landing page                     | No        |
| `/signup`     | Create an account                | No        |
| `/login`      | Log in                           | No        |
| `/onboarding` | Student + teacher setup          | Yes       |
| `/school`     | Student dashboard                | Yes       |

Protected routes are guarded in `src/proxy.ts`.

## Getting started

### 1. Create a Supabase project

At https://supabase.com create a free project. From **Project Settings → API** copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the database migration

In the Supabase **SQL Editor**, paste and run the contents of
`supabase/migrations/0001_initial_schema.sql`. This creates the `student_profiles`
and `teacher_profiles` tables, their triggers, and all Row Level Security policies.

### 3. Configure environment

```bash
cp .env.example .env.local
# then edit .env.local with your Supabase URL + anon key
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command             | Does                                          |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the dev server                          |
| `npm run build`     | Production build                              |
| `npm run typecheck` | `tsc --noEmit`                                |
| `npm run lint`      | ESLint                                        |
| `npm run cf:preview`| Build + run the Cloudflare Worker locally     |
| `npm run cf:deploy` | Build + deploy to Cloudflare Workers          |

## Deploy to Cloudflare

See the "How to deploy to Cloudflare" section in the project handover notes, or:

```bash
npx wrangler login
# Set the public env vars for the build (see .env.example), then:
npm run cf:deploy
```

Everything here runs on free tiers (Supabase free project + Cloudflare Workers free
plan). Nothing requires payment.

## Security notes

- Only the **anon** key is used client-side. The service-role key is never present.
- RLS ensures each student can read/write **only their own** rows.
- Only the minimum personal data needed for onboarding is collected. A full
  child-safety / privacy review is planned before any public launch.
