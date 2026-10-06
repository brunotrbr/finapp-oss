# Royal Gold dashboard port

The Lovable/TanStack home in `royal-gold-finance/src/routes/index.tsx` now lives at
`/dashboard` in the Next.js App Router. Portuguese labels, the cream/royal/gold OKLCH
palette, rounded cards, and all three financial views are preserved. The layout is
mobile first and fills the browser viewport with no 448px content-width limit.
On phones, the main balance sits above two summary cards; at 768px and above, all
three cards share one row. Page gutters increase from 20px to 32px and then 48px
as space grows. The financial list uses the available width, with the footer at
the bottom of short pages. On narrow phones, confirmation buttons move below their
bill and summary amounts use smaller type to keep the cards within the viewport.

- `app/dashboard/page.tsx` verifies the existing Firebase session before rendering.
  The user's label, initials, date formatted in the São Paulo timezone, and account
  data are passed to the interactive dashboard; no session cookie or token is passed.
- `app/dashboard/finance-dashboard.tsx` contains the original tabs and local bill
  confirmation behavior. Confirmations reset on reload, as in the source app.
- `app/dashboard/layout.tsx` loads Libre Franklin, Libre Baskerville, and IBM Plex
  Mono with `next/font`. The fonts and palette are scoped to the dashboard.
- `lib/finance-data.ts` retains the original typed demonstration data. Replace this
  data with authenticated backend queries when finance endpoints are available.
- The existing logout flow deletes the server session and signs out of Firebase.
  A failed logout displays a retry message instead of leaving a disabled button.
- `/login` redirects only after verifying the session. Checking cookie presence in
  the proxy caused invalid cookies to loop between `/login` and `/dashboard`.

No new API keys or URLs are required for this port. Existing configuration
placeholders remain in `.env.example`; real credentials belong in `.env.local`.
The dashboard displays “Dados de demonstração” until financial data is connected.

## Account selection

The selector starts with “todas contas”, followed by one option per account. Each
account has a stable `id` and a display `name`; selection uses the ID even when
different accounts have the same name. The heading, balances, monthly totals,
pending bills, upcoming bills, and transactions update together on selection.
“todas contas” sums monetary values in cents and combines the accounts' records.
Local confirmations use both account ID and bill ID, so switching views preserves
confirmations without affecting a similarly identified bill in another account.

`demoFinanceAccounts` currently supplies Conta principal and Nubank as placeholders.
There is no account API in the backend yet. Replace the demo prop in the authenticated
server page with the accounts fetched for `user.uid`; the backend must verify account
ownership before returning data. The selector supports any number of supplied accounts.
Use `npm test` to verify consolidation, isolation, and account/record identifiers.

## Manual verification with a configured Firebase project

The hamburger button in the header opens a responsive right-side navigation drawer
with Visão geral, Minhas contas, Pendentes, Próximas contas, and Lançamentos. These
items navigate to the existing dashboard sections and select the corresponding tab;
the dashboard owns the selected category so changing a tab also updates the drawer's
highlight and `aria-current`, including when returning from Visão geral or Minhas contas.
Navigation preserves the selected account and local confirmations. The native modal dialog
contains keyboard focus, closes with Escape or a backdrop click, and restores focus
to the trigger when dismissed. Choosing an item moves focus to its destination.
The drawer slides in from the right and the backdrop fades over 280ms on opening
and closing. Users who prefer reduced motion get an immediate transition.
Navigation to additional app pages can be added when those routes exist.

The initials avatar is a button that opens a user dropdown with Perfil and
Configurações, followed by a separator and Sair as the final option. The sign-out
button now lives in this dropdown rather than the dashboard footer. The dropdown
supports arrow keys, Escape, and dismissal when clicking outside.
Perfil shows the signed-in user's label; Configurações opens a placeholder until
settings are implemented. Both dialogs can be closed to return to the dashboard.

1. Open `/dashboard` while logged out: it redirects to `/login`.
2. Log in using the existing email/password or Google flow: it opens `/dashboard`.
3. Check the layout at 320px, 375px, 768px, 1024px, and 1440px widths, including dark OS mode.
   Confirm that desktop content spans the browser width with page gutters, cards
   reflow on resize, and phones have no horizontal scrolling. This fills the browser
   viewport; it does not invoke the browser's immersive fullscreen mode.
   Open the hamburger menu, use each destination, and check that the account remains
   selected. Check Escape, backdrop dismissal, and keyboard focus inside the drawer.
   Choose Pendentes in the drawer, switch to Lançamentos using the dashboard tab,
   and reopen the drawer: only Lançamentos should be marked as the current category.
4. Switch between Pendentes, Próximas, and Lançamentos; confirm all pending bills
   and verify the empty state. Reload to restore the demonstration data.
   Select each account and check its heading and data; select “todas contas” to
   restore the combined view. Confirm a bill in one view and switch back to verify
   that its confirmation persists across account selection.
5. Use Sair: the session ends and `/dashboard` requires login again.
6. Use an expired or invalid `__session` cookie: `/login` remains accessible and
   the dashboard is never rendered.
