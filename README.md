# Golden Control — first implementation slice

This is a working vertical slice you can drop into your existing Next.js project:
the **design foundation + app shell + full User Management feature + 404**, all on
mock data and wired through the architecture's layers (model → repo → service →
query hook → component). Swap the mock repository for real Axios calls later and
nothing above it changes.

## What's included

```
tailwind.config.ts                      gold tokens, RTL fonts, dark mode
src/
├─ styles/tokens.css                     light/dark CSS variables (design.md)
├─ app/
│  ├─ globals.css                        imports tokens + Tailwind + RTL base
│  ├─ not-found.tsx                       404 (screenshot 7)
│  └─ (dashboard)/
│     ├─ layout.tsx                       providers + Shell
│     ├─ settings/users/
│     │  ├─ page.tsx                      list  (screenshot 1)
│     │  ├─ new/page.tsx                  create (screenshot 4)
│     │  └─ [userId]/
│     │     ├─ page.tsx                   profile view (screenshot 5)
│     │     └─ edit/page.tsx              edit (screenshot 6)
│     └─ technicians/inventory/
│        ├─ page.tsx                      daily-inventory grid (screenshot 2)
│        └─ new/page.tsx                  create inventory (screenshot 3)
├─ config/        constants.ts, navigation.ts
├─ lib/           icons.tsx, utils/cn.ts, format/currency.ts, auth/current-user.ts
├─ models/        auth/user.model.ts, users/*.schema.ts, technician/daily-inventory.model.ts
├─ mocks/         users.mock.ts, daily-inventory.mock.ts
├─ repositories/  user.repository.ts, technician.repository.ts   (MOCK — replace with Axios)
├─ services/      user.service.ts, technician.service.ts
├─ hooks/         query-keys.ts
├─ providers/     AppProviders.tsx, QueryProvider.tsx
├─ components/
│  ├─ ui/         Button, Card, Badge, Input, Select, Textarea, Spinner
│  └─ layout/     Sidebar, Topbar, Shell, PageHeader
└─ features/
   ├─ users/         components/* + hooks/* + index.ts
   └─ technicians/   daily-inventory grid + create form + hooks + index.ts
```

## Dependencies

Already in your stack: `@tanstack/react-query`, `zod`, `next-themes`, `tailwindcss`.
This slice also uses:

```bash
npm i react-hook-form @hookform/resolvers clsx tailwind-merge
```

(No MUI or icon library — icons are inline SVG in `src/lib/icons.tsx`. Swap to
MUI/lucide later where you want richer behavior, per design.md's
"MUI for behavior, Tailwind for skin".)

## Wiring it up

1. **Path alias** — ensure `tsconfig.json` has `"@/*": ["./src/*"]`.
2. **Tailwind** — replace `tailwind.config.ts`; make sure `content` covers `./src/**`.
3. **Global CSS** — import `src/app/globals.css` in your root `app/layout.tsx`.
4. **Root layout** — set Arabic + RTL and wire the fonts, e.g.:
   ```tsx
   import { Tajawal, Cairo } from "next/font/google";
   const heading = Tajawal({ subsets:["arabic"], weight:["500","700"], variable:"--font-heading" });
   const body = Cairo({ subsets:["arabic"], weight:["400","600"], variable:"--font-body" });
   // <html lang="ar" dir="rtl" className={`${heading.variable} ${body.variable}`}>
   ```
   (`AppProviders` here already includes ThemeProvider + QueryProvider for the
   dashboard group; if you prefer, lift it to the root layout instead.)
5. Visit **`/settings/users`**.

## Notes / next steps

- The repository is **mock + in-memory** (create/edit/delete persist for the
  session, with simulated latency and Zod parsing at the boundary). Replace each
  method body with an Axios call + `UserSchema.parse(...)` to go live.
- Auth is mocked (`lib/auth/current-user.ts`). When NextAuth lands, hydrate the
  topbar/profile and add the session guard in `(dashboard)/layout.tsx` + middleware.
- Delete confirmation currently uses `window.confirm`; replace with the
  `ConfirmDialog` component when built (design.md requires a modal for destructive
  actions).
- The list refetch interval / socket bridge isn't on this screen (User Management
  isn't a 5-min auto-refresh screen); those land with Dashboard/Inventory/Finance.
- Currency is **Syrian Lira (ل.س)** everywhere via `lib/format/currency.ts`. No JOD.
- Password is **Admin-only**: set on create, changed on edit; no self-service reset.
```
