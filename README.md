# Uply — Codebase guide

This is the restaurant restocking app, restructured for maintainability.
If you're a developer picking this up for the first time, read this first.

## Stack

- **React 18** + **Vite** (build tool / dev server)
- **Supabase** — auth, Postgres database, row-level security
- **lucide-react** — icons
- **fuzzysort** — typo-tolerant catalog search

## Folder structure

```
src/
  main.jsx                  Vite entry point — don't add logic here
  App.jsx                   Root component: auth state + routing only.
                             If you're tempted to add a feature here, it
                             almost certainly belongs in src/pages/ instead.

  lib/
    supabaseClient.js        Supabase connection (URL + publishable key)
    pdf/
      generatePdf.js           Generates invoice & purchase-order PDFs in
                                the browser using pdf-lib. No server needed.
    api/
      index.js                Barrel file — re-exports everything below.
                               Pages import from here: `import * as api from '...lib/api'`
      auth.js                  Login, session, profile, language preference
      restaurants.js           CRUD for restaurants
      products.js              CRUD for products, suppliers, price history, product requests
      orders.js                Orders, order items, delivery scheduling, stats
      favorites.js              Client favorites (heart icon)
      notifications.js          In-app notification bell
      invoices.js               Uploads generated invoice PDFs to Supabase
                                 Storage and links them to orders ("Mes factures")

  i18n/
    translations.js           FR/EN dictionary. Add new UI strings here,
                               never hardcode bilingual text inside a component.
    LanguageContext.jsx       React context + `useLanguage()` hook providing
                               `{ lang, setLang, t }`. `t('someKey')` looks up
                               the current language's translation.

  components/shared/          Reusable UI primitives used across many pages
    GlobalStyle.jsx            Fonts, CSS resets, color tokens (`colors` export)
    TopBar.jsx                 Page header bar + language toggle button
    StatusTab.jsx               Order status badge (Pending/Preparing/Delivered)
    Buttons.jsx                 PrimaryButton, Stepper (the +/- quantity control)
    Inputs.jsx                  TextField, EmptyState, SectionHeader, fmtDate, inputStyle
    index.js                    Barrel file for all of the above

  pages/
    Login.jsx                  Shared login screen (used by both roles)

    client/                    Everything a restaurant client sees
      ClientApp.jsx              Top-level controller: holds state, switches
                                  between the sub-screens below
      Home.jsx, Catalog.jsx, Cart.jsx, Orders.jsx,
      RequestProduct.jsx, Notifications.jsx, MyInvoices.jsx

    admin/                     Everything the Uply admin sees
      AdminApp.jsx                Top-level controller: tab navigation + state
      Home.jsx                    Dashboard overview / quick stats
      Stats.jsx                   Detailed statistics (top products, monthly totals)
      Restaurants.jsx              Create/delete restaurants
      Products.jsx                 Product CRUD, edit/delete/out-of-stock
      ProductDetailModal.jsx       Suppliers (multi-select) + price history per product
      ImportInvoiceModal.jsx       Manual invoice entry + duplicate-handling review step
      Requests.jsx                 Approve/decline client product suggestions
      Orders.jsx                   Order status, delivery date, send invoice / download PO
      Users.jsx                    View client accounts (invites are manual for now)
```

## Database migrations

Run these in order in the Supabase SQL Editor (each is idempotent —
safe to re-run, uses `if not exists` / `if not exists` guards):

1. `schema.sql` — initial tables, RLS policies, auto-profile trigger
2. `migration-v2.sql` — in_stock, order comments, delivery fields, favorites, notifications
3. `migration-v3.sql` — suppliers, price history (with auto-logging trigger), language preference
4. `migration-v4.sql` — order_items.unit_price, Storage bucket RLS policies for invoices

**Before running migration-v4.sql:** create a Storage bucket named
`invoices` from the Supabase dashboard (Storage → New bucket → name it
exactly `invoices`, can be private) — this must be done via the dashboard
UI, SQL alone can't create buckets. Then run the SQL in migration-v4.sql
to set the access policies on it.

## Conventions worth keeping

1. **One feature, one file (or one small folder).** When adding a new screen,
   create a new file in the right `pages/client/` or `pages/admin/` folder —
   don't add it into an existing file unless it's a tiny variant of that
   screen.

2. **All user-facing text goes through `t('key')`.** Add the key + both
   French and English strings to `src/i18n/translations.js`. Never write
   `lang === 'fr' ? '...' : '...'` inline in a component — it doesn't scale
   and it's easy to miss a spot.

3. **All Supabase calls go through `src/lib/api/`.** Pages should never
   import `supabase` directly and write raw queries inline — wrap new
   queries as functions in the relevant `api/*.js` file, export them, and
   call them from the page via `api.functionName(...)`. This keeps
   database logic testable and in one place if the schema changes.

4. **Shared visual components belong in `components/shared/`.** If you
   notice yourself copy-pasting a `<button style={{...}}>` block into a
   third page, stop and extract it into a shared component instead.

5. **Database schema changes are tracked as numbered migration files**
   (`migration-v2.sql`, `migration-v3.sql`, etc.) run manually in the
   Supabase SQL Editor. When you add a new one, give it the next number
   and keep it in version control alongside the app code so the schema
   history is traceable.

## Known intentional gaps (as of this version)

- **User invitations** are not done in-app. Creating a new client login
  currently requires using the Supabase dashboard directly
  (Authentication → Users), then assigning them a restaurant from the
  Admin → Users tab. A proper "Invite" button needs a Supabase Edge
  Function holding a service-role key — deferred for cost/complexity
  reasons, see project notes.
- **AI-powered invoice scanning** is deferred (would require a paid
  AI/OCR API call per scan). The current "Importer une facture"
  flow is fully manual data entry with duplicate detection, which is free.

## Running locally

```bash
npm install
npm run dev       # starts the dev server
npm run build     # production build, output in dist/
```
