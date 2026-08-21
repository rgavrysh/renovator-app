# UI Upgrade Plan — a Linear-grade interface for Renovator

**Date:** 19 August 2026
**Goal:** make the app something a user *wants* to open and browse, not just a tool they use when they must.
**Visual reference:** [Linear](https://linear.app/) — small rounded controls, quiet chrome, one accent, comfortable reading columns, keyboard-first.

## How this relates to the two existing documents

| Document | What it is | Relationship |
|---|---|---|
| [`UX_REVIEW.md`](UX_REVIEW.md) | 42 findings from a static + rendered audit | **Diagnosis.** This plan does not repeat it |
| [`UX_IMPLEMENTATION_PLAN.md`](UX_IMPLEMENTATION_PLAN.md) | 27 steps that fix those findings under a "no rewrites, no new dependencies" constraint | **Correctness.** Removes defects and inconsistency |
| **This document** | A visual and interaction language, plus the shell to hang it on | **Appeal.** Makes the app feel like a product |

The distinction matters, because the two plans pull in different directions and it is worth being honest about it. `UX_IMPLEMENTATION_PLAN.md` was written under a constraint you set — no large rewrites, no new dependencies — and it obeyed that constraint by parking eight items in a "Needs your decision" table. **Six of those eight parked items are exactly what produces the feeling you're asking for.** The app shell (`D2`), the toast/feedback layer (`D5`), the row primitive (`D6`), the information hierarchy (`D7`), the palette (`D8`), and per-record routes (`D1`) are all deferred there.

So this is not a third parallel plan. It is the argument for un-parking those items, plus the visual layer that neither existing document covers at all: type scale, density, iconography, motion, and reading comfort.

**Current state:** `S0`–`S12` are committed (through `3cf87df`). Batch A (`U1.1`–`U1.4`, `U1.6`, `U1.7`), `U1.5` (Batch B), Batch C (`U2.1`, `U2.2`, `U2.4` done; `U2.3` partially done — see its implementation note), Batch D (`U3.1`–`U3.3`), Batch E (`U4.1`–`U4.4`), Batch F (`U5.1`–`U5.3`), and `U7.1`/`U7.3` (Batch H, partially — see `U7.2`'s note) are implemented. Everything below is written against that baseline.

---

## Part 1 — What actually makes Linear feel like Linear

From the screenshots you shared, eight traits do nearly all the work. Each is listed with what the app does today, so the gap is concrete rather than a mood.

### 1. The chrome is quiet and permanent; the content is the only thing with weight

Linear's sidebar is a flat surface with no border radius, no shadow, no card. Nav rows are ~28px tall, 13px text, monochrome 16px icons, and the active row is a barely-there gray fill. Section labels ("Workspace", "Your teams", "Try") are small, gray, and unobtrusive. Nothing in the chrome competes with what you're reading.

**Today:** there is no chrome. Four pages hand-roll a header containing a logo and an account menu. `Sidebar` and `HeaderNavItem` exist, are well-built, and render only on `/components`. Wayfinding is `← Back` buttons.

### 2. Everything floats on one canvas; cards are rare

Linear's project page is content directly on the canvas — heading, description, properties — with dividers only where structure genuinely changes. There is no card around the description, no card around the properties panel.

**Today:** `Card` wraps almost everything, and each card carries `border border-gray-200` *plus* `shadow-linear`, with `hover:shadow-md` layered on hover cards. On `ProjectDetail` this produces a page of nested boxes, each drawing a rectangle around content that didn't need one.

### 3. Status is a glyph, not a pill

This is the single most Linear-specific visual detail. Backlog is a dotted circle, Todo an empty circle, In Progress a half-filled circle, Done a filled check, Canceled a crossed circle. Colour and shape carry state at 14px, inline, without stealing the row.

**Today:** `Badge` is a filled `rounded-full` pill with eight variants, and status is rendered as a coloured pill roughly everywhere. On a list of twelve tasks that's twelve saturated rectangles competing with the task names.

### 4. One accent, spent on one thing

In every screenshot the only saturated colour is "Create project". Everything else is gray. Even the selected status in the dropdown is a checkmark, not a fill.

**Today:** `ProjectDetail` has six competing primary buttons, a green "Complete", an indigo "Add task", and a saturated red "Remove budget" holding permanent prime position in the rail (`UX_REVIEW.md` #20).

### 5. Reading surfaces get real typography and real width

The project description in your screenshot sits in a wide, centred column with generous line-height at a comfortable reading size — visibly larger than the 13px UI chrome around it. Linear runs two type scales: a compact one for controls, a comfortable one for prose.

**Today:** one scale, and it's the compact one. `text-sm` (14px) and `text-xs` (12px) dominate; `text-base` appears three times in the entire `src` tree. Task notes and project descriptions render at the same 14px as button labels, in a `max-w-7xl` container with no reading width.

### 6. Empty is an invitation, not a void

"Add a description…", "Add lead", "Add members", "Set target date" — Linear's empty states are placeholder-styled, in place, and clickable. The properties panel is *mostly* empty in your screenshot and still looks intentional.

**Today:** empty states are either a bare grey sentence with no next step, or a bordered `Card` containing centred text. `EmptyState` exists and is never used inside `ProjectDetail`.

### 7. Editing happens where the value lives

Target date opens a popover anchored to the field, with a text input that accepts natural language ("Try: May 2027, Q4, 05/20/2027") *and* a calendar. Status opens a small menu with numeric shortcuts (`1`–`7`). No modal, no page change, no save button.

**Today:** eight modals on `ProjectDetail`, all driven by `useState`, none in the URL. Editing a milestone means a dialog over the whole screen.

### 8. Speed is visible

120ms transitions, hover states that respond instantly, pressed states, a command menu on `⌘K`, and shortcut hints printed next to menu items. The interface constantly signals that it is fast.

**Today:** no `active:` state anywhere in the app, no keyframes or animation config, no command menu, and loading is a centred spinner that blanks the region it replaces.

---

## The diagnosis in one line

**The app is built from boxes; Linear is built from a canvas, a quiet frame, and rows.** Almost every step below is a move from "wrap it in a bordered card" to "put it on the canvas and let type, spacing, and a 1px divider do the work."

---

## Part 2 — Three decisions before anything starts

These are cheap to make now and expensive to reverse later. Everything in Part 3 assumes an answer.

**All three are now decided (19 Aug 2026): `lucide-react` and self-hosted Inter are both approved, and the shell is in scope.** The reasoning is kept below because it explains what the steps that depend on them are trying to achieve.

### D-A · Adopt an icon library ✅ approved

61 hand-written inline `<svg>` elements live in 19 files; `DocumentList.tsx` alone has 10. They have inconsistent stroke widths and sizes, and they are the reason the interface reads as hand-made. Linear's icon set is uniform 16px, 1.5px stroke, monochrome.

**Recommendation:** `lucide-react` (~2kB gzipped per icon, tree-shaken, exact aesthetic match). This breaks the "no new dependencies" constraint from the other plan, deliberately.
**Alternative:** hand-build an `Icon` component wrapping a local sprite. Same visual result, roughly 2 extra days and ongoing maintenance.

### D-B · Adopt Inter as the UI typeface ✅ approved

The current stack is `-apple-system, BlinkMacSystemFont, …`, so the app renders in SF on Mac and Segoe on Windows — two different looks, neither of them tight. A large part of what reads as "Linear" is Inter with slightly negative letter-spacing on headings.

**Recommendation:** self-host Inter variable (~110kB woff2, one file, no external request, no CLS if preloaded).
**Alternative:** keep the system stack and accept that Windows users see a noticeably looser interface.

### D-C · Confirm the shell is in scope ✅ in scope

Phase `U2` builds the persistent sidebar and deletes the four duplicated page headers. It is the largest single change here and the one that most changes how the app feels — it is also `D2` in the other plan, currently de-scoped. **Nothing else in this document delivers "wants to browse around" on its own.** Without navigation, there is nothing to browse.

If the answer is no, `U1`, `U3`, `U4` and `U5` still stand alone and are worth doing.

---

## Part 3 — The plan

Effort: **S** ≈ half a day or less · **M** ≈ one to three days · **L** ≈ more than three days.
Step IDs are stable and don't clash with the `S`-series in `UX_IMPLEMENTATION_PLAN.md`. To start work, name the ID.

---

## Phase U1 — The visual language

No layout moves. Config and primitives only, so the whole app changes at once and each step is reviewable in isolation. This phase is where the largest visual return per hour sits.

### U1.1 · Two type scales instead of one ✅ done

Add a semantic scale to `tailwind.config.js` so "UI text" and "reading text" stop being the same thing.

```js
fontSize: {
  // UI scale — controls, nav, table cells, metadata
  'ui-xs':  ['11px', { lineHeight: '16px', letterSpacing: '0' }],
  'ui-sm':  ['12px', { lineHeight: '16px' }],
  'ui':     ['13px', { lineHeight: '20px' }],   // the app's default UI size
  'ui-lg':  ['15px', { lineHeight: '22px' }],
  // Reading scale — descriptions, notes, prose
  'body':   ['15px', { lineHeight: '24px' }],
  'body-lg':['16px', { lineHeight: '26px' }],
  // Headings — tight tracking is most of the "Linear" signature
  'title-sm': ['15px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '600' }],
  'title':    ['18px', { lineHeight: '24px', letterSpacing: '-0.015em', fontWeight: '600' }],
  'title-lg': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '600' }],
},
```

Migrate the primitives in `ui/` first (`Button`, `Badge`, `Input`, `Select`, `Textarea`, `Card`), then pages. Leave `text-sm`/`text-xs` working throughout so migration is incremental rather than a big-bang find-and-replace.

**Where:** `tailwind.config.js`, then `src/components/ui/*`. **Effort:** M · 👁

### U1.2 · Fixed control heights and an 8px rhythm ✅ done

Linear's density comes from controls that are all exactly 28px or 32px tall and never grow with their padding. Today `Button`, `Input` and `Select` each derive height from `py-*` independently, so a button and the input beside it don't line up.

Give every control an explicit `h-7` (28px, `sm`) / `h-8` (32px, `md`) / `h-9` (36px, `lg`) and adjust padding to fit. Standardise gaps on 4/8/12/16/24.

**Where:** `ui/Button.tsx`, `ui/Input.tsx`, `ui/Select.tsx`, `ui/Checkbox.tsx`. **Effort:** S · 👁

### U1.3 · Delete the shadows ✅ done

`Card` currently carries a border *and* `shadow-linear`, and hover cards add `hover:shadow-md` on top. Linear uses exactly one elevation rule: **flat surfaces get a 1px border; only floating layers (popover, dropdown, modal, toast) get a shadow.**

- `Card`: drop `shadow-linear`; keep `border border-gray-200`.
- `Card hover`: `hover:shadow-md` → `hover:border-gray-300 hover:bg-gray-50/50`.
- `Button`: drop `shadow-sm` from all variants.
- Keep and slightly soften `shadow-lg` on `Modal`; add a matching `shadow-popover` token for `U6.2`.

This is four small edits and it is the single most visible step in `U1`.

**Where:** `ui/Card.tsx`, `ui/Button.tsx`, `tailwind.config.js`. **Effort:** S · 👁

### U1.4 · Surface and border tokens ✅ done

Roughly 50 direct `bg-white` / `bg-gray-50` / `bg-black/60` classes have no token indirection. Alias them now — it costs nothing today and it is the difference between a one-day and a two-week dark mode later.

```js
colors: {
  canvas:  '#fbfbfb',   // page background
  surface: '#ffffff',   // raised content
  subtle:  '#f7f7f8',   // hover fills, quiet chrome
  border: { subtle: '#eeeef0', DEFAULT: '#e5e5e7', strong: '#d4d4d8' },
}
```

Note the deliberate difference from today: Linear's canvas is barely-off-white and its borders are noticeably lighter than `gray-200`. Lightening the borders alone visibly calms `ProjectDetail`.

**Where:** `tailwind.config.js`, `ui/*`, `layout/*`. **Effort:** M

### U1.5 · Semantic status colours, then one accent ✅ done

This is `S20` from the other plan and it is a hard prerequisite for `U5` — do it here rather than in Phase 5 of that plan. Add `success`/`warning`/`danger`/`info` scales seeded from current values, extract `utils/statusColors.ts`, and consolidate the 8 duplicated status→colour maps.

Then, immediately after (this is `D8`), regenerate `primary` at a fixed hue so the 600 fill and the 500 focus ring stop disagreeing, keeping 600 as the anchor so buttons look unchanged.

**Where:** `tailwind.config.js`, new `utils/statusColors.ts`, 25 files. **Effort:** M

**Implementation note:** `primary` was regenerated at a fixed 238° hue (the old 600's own hue), keeping `600` bit-for-bit `#4c51e8` so filled buttons are pixel-identical; `50`–`900` no longer drift toward blue as they darken. `success`/`warning`/`danger`/`info` were seeded exactly from the Tailwind green/yellow/red/blue shades `Badge` and `Alert` already rendered, so adopting the tokens is a rename with no visual change — verified in `tailwind.config.test.ts`. `utils/statusColors.ts` consolidates all eight status→variant maps (task status, task priority, project status, milestone status, resource status, budget category, plus the two status→dot-colour maps in `TaskList` and `MilestoneList`) with typed lookup functions and a fallback to `'default'`/neutral for unknown values, covered by `utils/statusColors.test.ts`. `Badge`, `Alert`, `TaskDetail`, `ProjectDetail`, `Dashboard`, `MilestoneList`, `TaskList`, `ResourceList` and `BudgetItemsList` were migrated to the new tokens/utility. (Note: since each file's status enum is locally declared rather than a shared type, the maps are keyed by string value, not by enum — de-duplicating the enums themselves is a separate, larger change and is not part of this step.)

### U1.6 · Motion ✅ done

```js
transitionDuration: { DEFAULT: '120ms' },
keyframes: {
  'fade-in':  { from: { opacity: 0 }, to: { opacity: 1 } },
  'pop-in':   { from: { opacity: 0, transform: 'scale(0.97) translateY(-2px)' },
                to:   { opacity: 1, transform: 'scale(1) translateY(0)' } },
},
animation: {
  'fade-in': 'fade-in 120ms ease-out',
  'pop-in':  'pop-in 120ms cubic-bezier(0.16, 1, 0.3, 1)',
},
```

Then add `active:` fills and `active:scale-[0.98]` to `Button` (this is `S23`), and `animate-pop-in` to `Modal`'s panel with `animate-fade-in` on its backdrop. Modals currently appear with no transition at all.

**Where:** `tailwind.config.js`, `ui/Button.tsx`, `ui/Modal.tsx`. **Effort:** S · 👁

### U1.7 · Typography install ✅ done

Self-host Inter variable, preload it, set `fontFamily.sans`, and add `font-feature-settings: 'cv11', 'ss01'` plus `-webkit-font-smoothing: antialiased` (already present) in `index.css`. Gated on **D-B**.

**Where:** `public/fonts/`, `index.html`, `index.css`, `tailwind.config.js`. **Effort:** S · 👁

**Phase outcome:** every screen looks calmer, denser and more deliberate, with no layout or routing changed and no page file touched beyond class swaps.

---

## Phase U2 — The shell

Gated on **D-C**. This is `D2` + `#5` + `#37` from the review, and it is the step that turns four disconnected pages into a product.

### U2.1 · `AppShell` layout route ✅ done

One layout route rendering a persistent sidebar and a slim top bar, with `<Outlet/>` for the page. Hoist `ProtectedRoute` into it. Delete the hand-rolled header from `Dashboard`, `ProjectDetail`, `ProjectForm` and `WorkItemsLibrary` (~120 duplicated lines).

Structure, following your screenshots:

```
┌──────────────┬─────────────────────────────────────────┐
│ Renovator  ⌄ │  Projects › Kitchen remodel      [+ New]│  ← 40px bar: breadcrumb + page actions
│              ├─────────────────────────────────────────┤
│  Search   ⌘K │  Overview   Tasks   Budget   Documents  │  ← tab row, small rounded pills
│  Inbox       ├─────────────────────────────────────────┤
│              │                                         │
│ WORKSPACE    │              page content               │
│  Projects    │                                         │
│  Work catalog│                                         │
│  Materials   │                                         │
│  Suppliers   │                                         │
└──────────────┴─────────────────────────────────────────┘
```

240px sidebar, `bg-subtle`, no radius, one right border. Rows: `h-7`, `text-ui`, 16px icon, `gap-2`, active = `bg-gray-200/60 text-gray-900` with no border. Section labels in `text-ui-xs uppercase tracking-wider text-gray-500`.

**Where:** new `components/layout/AppShell.tsx`, `router.tsx`, four pages. **Effort:** M · 👁

**Implementation note:** `AppShell` is a layout route wrapping `ProtectedRoute`, with a persistent desktop sidebar, a slim top bar (breadcrumb + page-actions slot + language switcher + user dropdown), and `<Outlet/>` for the page. `Dashboard`, `ProjectDetail`, `ProjectForm` and `WorkItemsLibrary` had their hand-rolled headers removed. `App.tsx`/`App.test.tsx` were deleted since `AppShell` replaced their role as the root authenticated layout. The tab row shown in the mockup (`Overview  Tasks  Budget  Documents`) was not built — `ProjectDetail` still renders those as sections on one page rather than routed tabs; that remains open for a future step. Covered by `components/layout/AppShell.test.tsx`.

### U2.2 · Responsive behaviour, shipped in the same change ✅ done

The review is explicit that this must not lag behind `U2.1`: `Sidebar` has no narrow-width behaviour and will steal 256px on a phone the moment the shell ships. `hidden lg:flex` plus a slide-in drawer and a hamburger in the top bar, in the same PR.

**Where:** `AppShell.tsx`, `layout/Sidebar.tsx`. **Effort:** M · 👁

**Implementation note:** shipped as part of `U2.1` in the same `AppShell.tsx`, since the two aren't meaningfully separable. Desktop sidebar is `hidden lg:flex`; below `lg` a hamburger button opens a slide-in drawer with a backdrop, closes on backdrop click, `Escape`, or navigating to a link inside it. Covered by `components/layout/AppShell.test.tsx`.

The desktop sidebar is additionally **collapsible** (icon-only, `w-14`, toggled by a chevron button in the sidebar's top row, beside the brand mark — a `ChevronLeft` next to "Renovator" when expanded, a centered `ChevronRight` in its own row right below the brand mark when collapsed). Collapsing hides the "Renovator" wordmark, the "Workspace" section label, and nav-item text — icons remain, each with a native `title` tooltip carrying the label so the collapsed rail stays a11y-friendly and still fully navigable. The preference persists in `localStorage` (`appShell.sidebarCollapsed`) so it survives reloads; it only affects the `lg`+ sidebar, not the mobile drawer, which is always full-width when open since it's already an overlay. Covered by two more cases in `components/layout/AppShell.test.tsx`: toggling collapses/expands the rail, and the preference is read back on a fresh mount.

### U2.3 · Surface the two hidden features ⚠️ partially done

Suppliers, materials and the budget overview are fully built, tested, backed by complete API routes, and have no route in the frontend (`#9`/`D3`). The work-items library is reachable only from inside the account dropdown. Give all three a sidebar destination.

This is the cheapest "new feature" available: three route entries make finished, tested work reachable. Also mirror `SupplierList` in `ResourceList` so materials get create/edit/delete from their own UI (`#39`).

**Where:** `router.tsx`, `AppShell.tsx`, `components/ResourceList.tsx`. **Effort:** M

**Implementation note:** Suppliers is done — a new `pages/SuppliersPage.tsx` gives the existing `SupplierList` a top-level route and a sidebar link, covered by `pages/SuppliersPage.test.tsx`. Materials and the budget overview were **not** given global routes: `Resource` (materials) and budget records are project-scoped in the backend (`GET /api/projects/:id/resources`, not a global collection), so a global "Materials" page would either need a new cross-project backend endpoint or would be misleading. They stay reachable from inside each project instead. Mirroring `SupplierList`'s create/edit/delete UI into `ResourceList` (`#39`) was also **not** done — `ResourceList` is still read-only; this is a real, separately-sized piece of work (form, mutations, tests) and is left as an explicit follow-up.

### U2.4 · Breadcrumbs and titles ✅ done

Breadcrumb from route data (`Projects › Kitchen remodel › Tasks`) with a small icon per level, and `document.title` per page. Both become trivial once `U2.1` exists, and both remove the `← Back` buttons.

**Where:** `AppShell.tsx`, `router.tsx`. **Effort:** S

**Implementation note:** breadcrumbs are derived from route `handle` metadata (`RouteHandle` in `router.tsx`) via `useMatches`, with a static `crumbKey` for most routes and a `dynamicCrumb` flag for `projects/:id`/`projects/:id/edit`, where the page itself supplies the label (e.g. the project name) through `useAppShell().setBreadcrumbLabel`. `document.title` updates to match the current breadcrumb. `← Back` buttons were removed from `ProjectDetail`. Covered by `components/layout/AppShell.test.tsx`.

**Phase outcome:** the app has a home, everything is one click away, and one of the two complete features (Suppliers) stops being invisible. Materials remains project-scoped rather than global, and its own create/edit/delete UI is still open (see `U2.3`).

---

## Phase U3 — Icons and status glyphs

Gated on **D-A**.

### U3.1 · Replace all 61 inline SVGs ✅ done

One pass per file, 16px default, `strokeWidth={1.5}`, `currentColor`. Priority order by count: `DocumentList` (10), `ResourceList` (7), `PhotoGallery` (6), `ui/Alert` (5), then the rest.

**Effort:** M

**Implementation note:** `lucide-react` added as the icon dependency (`D-A`). Every hand-drawn inline `<svg>` across `ui/Alert`, `ui/Button`, `ui/Modal`, `ui/Spinner`, `DocumentList`, `ResourceList`, `PhotoGallery`, `PhotoUpload`, `DocumentUpload`, `SupplierList`, `WorkItemsLibraryModal`, `UserDropdown`, `layout/AppShell`, `pages/ProjectDetail`, `pages/Dashboard`, `pages/AuthCallback`, `pages/GoogleDriveCallback` and `pages/ComponentShowcase` was replaced with the matching `lucide-react` component at `strokeWidth={1.5}`. The one recurring brand mark that has no `lucide` equivalent — the Google Drive logo — was extracted once into `components/icons/GoogleDriveIcon.tsx` instead of staying duplicated across five files. The only inline SVGs remaining in the tree are the ones that *are* icon primitives: `ui/StatusIcon.tsx` and `components/icons/GoogleDriveIcon.tsx`.

### U3.2 · `StatusIcon` — the signature detail ✅ done

A single component rendering the state as a 14px glyph rather than a pill: dotted circle (not started), empty circle (todo), half-filled arc (in progress), filled check (done), crossed circle (cancelled), plus a filled-arc variant driven by percentage for milestone progress.

Then demote `Badge` from "status carrier" to "label carrier" — status becomes glyph + plain text, and the pill survives only for genuine labels like document type and budget category. A task list stops being a wall of coloured rectangles.

**Where:** new `ui/StatusIcon.tsx`, `TaskList`, `MilestoneList`, `Dashboard`, `ProjectDetail`. **Effort:** M · 👁

**Implementation note:** `ui/StatusIcon.tsx` renders the fixed five-state glyph set and accepts an optional `progress` (0–100) that overrides the `in-progress` half-arc with an arc proportional to actual completion, used by `MilestoneList`. `utils/statusColors.ts` gained a domain-agnostic `StatusIconKind` type plus `getTaskStatusIconKind` / `getProjectStatusIconKind` / `getMilestoneStatusIconKind` mapping each local enum onto it. `TaskList`, `MilestoneList`, `Dashboard` and `ProjectDetail` all now render `<StatusIcon /> + plain text` for status instead of a `Badge`; `Badge` remains for genuine labels (task priority, document type, budget category). Covered by `ui/StatusIcon.test.tsx`, `utils/statusColors.test.ts`, and updated assertions in `TaskList.test.tsx`, `MilestoneList.test.tsx`, `Dashboard.test.tsx`.

### U3.3 · `IconButton` ✅ done

Icon-only actions currently appear as bare SVGs in buttons with three different hover treatments and no accessible name. One primitive: `h-7 w-7`, `rounded`, `hover:bg-subtle`, tooltip, required `label`. Part of `D6` in the other plan.

**Where:** new `ui/IconButton.tsx`. **Effort:** S

**Implementation note:** `ui/IconButton.tsx` is a `forwardRef` button with a required `label` used as both `aria-label` and `title`, `sm`/`md` sizes, and `default`/`danger` variants sharing one hover/focus treatment. Adopted for the icon-only actions in `DocumentList`, `SupplierList` and `ProjectDetail`'s inline budget edit/save/cancel controls. Covered by `ui/IconButton.test.tsx`. While fixing this, `Modal`'s close button gained an `aria-label` (`"Dismiss"`, chosen to not collide with the many plain-text "Close" footer buttons already asserted on by existing tests) — it previously had no accessible name at all.

---

## Phase U4 — Reading comfort

This is the part of your request that is most specific: *"section with important context (like task description) has comfortable size and font to read."*

### U4.1 · Reading width ✅ done

`Container` currently offers `max-w-7xl` for everything. Add a `prose` size at `max-w-[68ch]` and use it for descriptions, notes and any long text. At 1440px a description currently runs the full content width, which is roughly 160 characters per line — about double what's comfortable.

**Where:** `layout/Container.tsx`. **Effort:** S

**Implementation note:** added a `prose` option to `ContainerProps['size']` mapping to `max-w-[68ch]`, alongside the existing `sm`–`full` sizes. Used (with `padding={false}`, since it's nested inside existing card/modal padding rather than a page-level container) to wrap the description text in both `TaskDetail` and `ProjectDetail`'s Project Information card. Covered by `layout/Container.test.tsx`.

### U4.2 · Description and notes as first-class content ✅ done

Project description and task notes get `text-body` (15px/24px) rather than `text-sm`, `text-gray-800` rather than `text-gray-700`, real paragraph spacing, and a placeholder-style empty state (`Add a description…` in `text-gray-400`, clickable) instead of being hidden when absent.

**Where:** `pages/ProjectDetail.tsx`, `components/TaskDetail.tsx`. **Effort:** S · 👁

**Implementation note:** task and project descriptions are split on newlines and rendered as separate `text-body text-gray-800` paragraphs (`mb-3 last:mb-0`) inside the new `prose` container, instead of one `text-sm text-gray-600` line. When a description is absent, a `text-gray-400 italic` placeholder (`taskDetail.addDescriptionPlaceholder` / `projectDetail.addDescriptionPlaceholder`) is shown; it's a clickable `<button>` calling `onEdit(task)` / navigating to the project edit route when an edit path exists, and a plain (non-interactive) `<p>` otherwise — `TaskDetail` doesn't always receive an `onEdit` prop. Notes history text was bumped from `text-sm` to `text-body text-gray-800` to match. Client email/phone in `ProjectDetail`'s rail got the same quiet "Add client email…" / "Add client phone…" placeholder treatment for consistency with `U4.3`'s rail. Covered by new cases in `TaskDetail.test.tsx` and `ProjectDetail.test.tsx`.

### U4.3 · Detail layout: content column plus properties rail ✅ done

Restructure `TaskDetail` and the `ProjectDetail` header to the two-column shape in your screenshots — title, description and activity in the reading column; a right rail of label/value property rows (status, assignee, dates, milestone) at `text-ui`, each row inline-editable, each empty value shown as a quiet "Add …" affordance.

This replaces the current pattern where the same information is a dense grid of `text-xs` label / `text-sm` value pairs.

**Where:** `components/TaskDetail.tsx`, `pages/ProjectDetail.tsx`. **Effort:** M · 👁

**Implementation note:** `TaskDetail`'s modal body is now `flex flex-col sm:flex-row gap-6` — a flexible reading column (description + notes) plus a `sm:w-48` properties rail (status, priority, due date, completed date, price, amount, actual price) with `text-ui-xs` labels over `text-ui` values, matching the "label/value property row" pattern rather than the old two-column grid of `text-xs`/`text-sm` pairs. Status remains a `<select>` when `onStatusChange` is provided and a plain glyph+text row otherwise — inline editing beyond that (a real popover, per `U6.2`) is still open. `ProjectDetail`'s "Project Information" card got the same treatment: `flex flex-col md:flex-row gap-6`, description in the content column, a `md:w-56` rail with dates and client contact info, with empty client fields getting the quiet "Add …" affordance from `U4.2` (clicking navigates to the edit form, since there's no per-field inline editor yet). The rest of `ProjectDetail` (milestones, tasks, documents, budget) was left as-is — only the header/information card was in scope, as the step title says. Covered by new cases in `TaskDetail.test.tsx` and `ProjectDetail.test.tsx`.

### U4.4 · Cap modal height ✅ done

`Modal` has no max-height, so titles and Save buttons scroll off the four long forms. `max-h-[calc(100vh-4rem)] flex flex-col` on the panel and `flex-1 overflow-y-auto` on the content fixes all 11 modals at once. (This is `S22`; it belongs here because `U4.3` makes modals taller.)

**Where:** `ui/Modal.tsx`. **Effort:** S

**Implementation note:** the panel is `max-h-[calc(100vh-4rem)] flex flex-col`, the header got `flex-shrink-0` so it never scrolls out of view, and the content wrapper is `flex-1 overflow-y-auto`. `ModalFooter` is passed as part of `children`, so on a tall form it scrolls with the rest of the content rather than staying pinned — the same trade-off implied by the plan's own snippet, which only names the panel and content, not a fourth "sticky footer" layer. Covered by three new cases in `ui/Modal.test.tsx`.

---

## Phase U5 — Rows ✅ done

Six list patterns exist today for one interaction — 3 radii, 3 separation strategies, 4 hover treatments, actions in 3 places. This is `D6`, and it is what stands between the app and looking like one thing.

### U5.1 · `ListRow` ✅ done

One primitive: `h-9`, no border, no radius, `hover:bg-subtle`, a 1px `border-subtle` divider between rows, leading `StatusIcon` slot, flexible content, trailing metadata slot, and an actions slot that is `opacity-0 group-hover:opacity-100`. Hover-revealed actions are the reason Linear's lists look empty and calm while still being fully actionable.

**Where:** new `ui/ListRow.tsx`. **Effort:** M · 👁

**Implementation note:** `ui/ListRow.tsx` exports `ListRow` (`min-h-9`, no border/radius of its own, `hover:bg-subtle`, `icon`/`meta`/`actions` slots, `onActivate` for the row-as-button case, and a `danger` prop) plus `ListRowGroup`, a thin `divide-y divide-border-subtle` wrapper that supplies the 1px divider between rows. `danger` tints row text (`text-danger-*`) instead of drawing a `bg-red-50 border-red-200` box — that box was the source of the misaligned-overdue-row bug (`#38`) fixed for free by every migration below, since rows no longer carry a conditional border. Actions are hidden via `opacity-0 group-hover:opacity-100`, but also revealed on `group-focus-within` so keyboard users can reach them without hovering. Covered by `ui/ListRow.test.tsx`.

### U5.2 · Migrate the six lists ✅ done

One per PR: `MilestoneList` → `TaskList` → `BudgetItemsList` → `DocumentList` → `SupplierList` → `ResourceList`. Each migration also picks up the aligned-overdue-row fix (`#38`) for free, since rows stop having conditional borders.

**Effort:** L (M each, independently shippable)

**Implementation note:** all six lists now render their rows through `ListRow`/`ListRowGroup`. `MilestoneList` and `TaskList` moved their per-row `Divider` bookkeeping onto `ListRowGroup` and their overdue-row box onto `ListRow`'s `danger` prop. `BudgetItemsList`, `DocumentList`, `SupplierList` and `ResourceList` — the four "card list" components that used to hand-roll `border border-gray-200 rounded-lg p-4 hover:shadow-sm` per item — lost that box entirely in favour of the flat row treatment; their multi-line content (description, tags, contact info, delivery details) now lives in `ListRow`'s flexible content slot rather than a bordered card, with compact facts (file size, cost, quantity, delivery date) moved to the trailing `meta` slot. `DocumentList`'s file-type icon shrank from 32px to 20px to fit the row's leading-icon slot, and its status colours were switched from raw Tailwind (`text-red-500`, `text-blue-500`, ...) to the semantic `danger`/`info`/`success` tokens from `U1.5`. `ResourceList` keeps its existing grouped-by-status sections (not made collapsible — out of scope for this step, see `U5.3`) but its per-item card is now a `ListRow`, and its overdue banner became an inline `⚠` note in the row rather than a separate red block. All six components' existing tests were updated in place for the new DOM shape (e.g. `.closest('.group')` to scope a query to one row, `getByRole('button', { name: /Category/ })` for group headers) rather than rewritten from scratch; none of the 27 pre-existing baseline failures (`S0`) grew as a result — same 28-test/11-file failure count before and after, confirmed by running the full suite on both sides of the change.

### U5.3 · Grouped, collapsible sections with counts ✅ done

Your Linear issues screenshot shows `Todo 4` as a collapsible group header with a `+` on hover. Apply to tasks (group by status) and budget items (group by category). Replaces the current three-filter-dropdown pattern with something you can scan.

**Where:** `TaskList.tsx`, `BudgetItemsList.tsx`. **Effort:** M · 👁

**Implementation note:** `TaskList` now groups by status in fixed lifecycle order (`To Do → In Progress → Blocked → Completed`), skipping empty groups; each group is a `<button aria-expanded>` header with a `StatusIcon`, the status label, and a count, collapsible independently (state kept in a local `collapsedGroups` map, not persisted). This **replaces the standalone status filter dropdown** — status is now something you scan via groups, not something you filter away — while the priority and milestone filters remain, since they narrow *within* the grouped view rather than duplicating it. `BudgetItemsList` switched its existing collapsible sections from grouping by **milestone** to grouping by **category** (`Labor`, `Materials`, ...) per this step's own wording, in fixed category order with a running total per group; the milestone name an item belongs to didn't disappear — it moved to a small secondary line on the item's row (`Foundation · notes text`) instead of being the grouping key. Both group headers reuse the same chevron-rotate + count pattern. Covered by new "groups tasks/items by X with a collapsible header showing a count", "does not render a header for an empty group", and "collapses/expands on click" cases in `TaskList.test.tsx` and `BudgetItemsList.test.tsx`.

---

## Phase U6 — The things that make it feel fast

Lowest effort-to-delight ratio in the document. Nothing here is required by any review finding, which is precisely why none of it is in the other plan.

### U6.1 · Toasts

`D5`. Saves are currently silent and success uses `window.alert`. A minimal provider reusing `Alert` styling, bottom-right, `animate-pop-in`, auto-dismiss at 4s, with an undo slot for destructive actions. Wire the money paths first.

**Effort:** M

### U6.2 · `Popover` and inline editing

A single anchored-popover primitive (`animate-pop-in`, click-outside, Escape), then convert the highest-frequency edits away from modals: status, target date, assignee, amount. Directly mirrors trait 7 — Linear's date picker is a popover with a text field *and* a calendar, not a dialog.

**Effort:** M–L

### U6.3 · Command palette on `⌘K`

Fuzzy search over projects, tasks, milestones and navigation, plus actions ("New project", "Add task"). ~200 lines against data already loaded. This is the feature most responsible for the "I'll just open it and poke around" feeling, and it makes the app feel fast regardless of how fast it is.

**Effort:** M

### U6.4 · Skeletons instead of spinners

Replace centred spinners with layout-shaped skeleton rows (`animate-pulse`, `bg-subtle`). The page stops flashing empty on every navigation.

**Effort:** S · 👁

### U6.5 · Keyboard shortcuts

`C` new, `/` search, `G then P` projects, `Escape` close, `⌘Enter` submit in forms — with the hints printed in menus, the way Linear prints `1`–`7` next to statuses. Discoverability is most of the value; a shortcut nobody can see is a shortcut nobody uses.

**Effort:** M

---

## Phase U7 — First impressions

### U7.1 · Login ✅ done

Currently a centred card on an empty field, no brand mark, no product explanation, and a button reading "Sign in with OAuth" — the protocol name. Give it the brand tile, one line of product copy, "Continue with Google" with the glyph, a loading state, and the `linear` tokens the rest of the app uses.

**Where:** `pages/Login.tsx`, new `components/icons/GoogleIcon.tsx`. **Effort:** S · 👁

**Implementation note:** the card-in-a-card look is gone — the page is now `bg-canvas` with a single `border-border`/`bg-surface` panel, no nested `Card`. Above it sits a brand tile (`bg-primary-600` square with a `lucide-react` `Hammer` glyph, standing in for a real logo asset, which doesn't exist yet), the `title-lg` wordmark and `text-gray-500` tagline. The button text changed from the protocol name ("Sign in with OAuth") to `t('login.signInButton')` = "Continue with Google", since the backend (`AuthService`) is Google OAuth specifically; a new hand-drawn `components/icons/GoogleIcon.tsx` (the four-colour "G" mark) sits next to the label, following the same "brand logo, not a `lucide` glyph" precedent as `GoogleDriveIcon` from `U3.1`. Clicking it sets a local `isSigningIn` state, swapping the label to `t('login.signingIn')` ("Signing in…") and disabling the button via `Button`'s existing `loading` prop — `AuthContext.login()` itself is synchronous (it fires a redirect after a background fetch), so this loading state is purely about not leaving the button clickable and mute during that gap. Covered by `pages/Login.test.tsx`.

### U7.2 · Dashboard as a dashboard — deferred

`D7`. Three or four stat tiles (active projects, spend vs budget, overdue tasks, next milestone due) above the list, plus progress and overdue chips on the cards. Needs your product judgement about what a renovator checks daily, and possibly one backend field for overdue counts.

**Decision (21 Aug 2026):** deferred, not implemented. Discussed and explicitly parked for a future, larger dashboards-and-reporting milestone rather than done piecemeal here — the cross-project aggregation this needs (overdue tasks, spend vs budget, next milestone, all currently only available per-project) deserves a proper backend design, not a step bolted onto the batch that also shipped `U7.1`/`U7.3`.

**Effort:** M (+ possible backend S)

### U7.3 · Empty states everywhere ✅ done

Every empty region becomes a quiet invitation: 16px muted icon, one sentence, one action. `EmptyState` exists and is used on exactly one page.

**Where:** `TaskList.tsx`, `MilestoneList.tsx`, `BudgetOverview.tsx`, `pages/WorkItemsLibrary.tsx`, `WorkItemsLibraryModal.tsx`. **Effort:** S

**Implementation note:** most list components (`SupplierList`, `ResourceList`, `DocumentList`, `BudgetItemsList`, `PhotoGallery`) already adopted `EmptyState` as part of the `U5.2` migrations, so the gap this step actually closed was five remaining bare `<div className="text-center py-8"><p>…</p></div>` regions that predated `U5`: no-tasks and no-tasks-match-filters in `TaskList`, no-milestones in `MilestoneList`, no-budget-set in `BudgetOverview`, and no-work-items-found in the `WorkItemsLibraryModal` picker — all converted to `EmptyState` with a `lucide-react` icon (`ClipboardList`, `SearchX`, `Flag`, `Wallet` respectively). `pages/WorkItemsLibrary.tsx`'s custom-templates-empty region was also converted from a bordered `p-12` box to a flat `EmptyState`, and — since it's the one case among these with an obvious next action — gained a "Create Template" button wired to the same handler as the page's header button, rather than staying a dead-end sentence. Milestones and the modal's no-results case have no create-from-here action available (creation happens elsewhere / there's nothing to create in a read-only picker), so they're icon + sentence only, per the plan's own "one sentence, one action" — where there is one. Covered by new cases in `TaskList.test.tsx`, `MilestoneList.test.tsx`, `BudgetOverview.test.tsx`, `pages/WorkItemsLibrary.test.tsx`, and `WorkItemsLibraryModal.test.tsx`.

---

## Part 4 — Overlap with `UX_IMPLEMENTATION_PLAN.md`

Read this before scheduling either document, so nothing is built twice.

| That plan | This plan | What to do |
|---|---|---|
| `S13` use the existing kit | `U5.2` | Done as part of the `U5.2` migrations |
| `S20` semantic status tokens | `U1.5` | **Pull forward.** `U3.2` and `U5` both depend on it |
| `S22` modal max-height | `U4.4` | Same step; do it in `U4` |
| `S23` button hierarchy + `active:` | `U1.6` | Same step; do it in `U1` |
| `S25` row alignment / overdue | `U5.1` | Done — `ListRow`'s `danger` prop removes the conditional border that caused it |
| `D1` per-record routes | — | Still open. `U2` makes it much cheaper by removing the header duplication first |
| `D2` app shell | `U2` | **Un-parked.** The core of this plan |
| `D5` toasts | `U6.1` | **Un-parked** |
| `D6` `ListRow` + `IconButton` | `U5.1`, `U3.3` | **Un-parked** |
| `D7` information hierarchy | `U7.2`, `U4.3` | **Un-parked**, still needs your input |
| `D8` palette regeneration | `U1.5` | **Un-parked**, scheduled immediately after semantic tokens as that plan advises |

`S14`–`S19`, `S21`, `S24`, `S26`, `S27` are unaffected and can run in parallel with anything here. `S16` (sentence case) is worth doing early — 58% of English copy is Title Case and it is the single largest deviation from the Linear reference, at zero code risk.

---

## Part 5 — Sequencing

| Batch | Steps | Effort | What changes for the user |
|---|---|---|---|
| **A** ✅ done | `U1.1`–`U1.4`, `U1.6`, `U1.7` | ~4–5 days | Every screen looks calmer and more deliberate. No layout moved |
| **B** ✅ done | `U1.5` + palette | ~2–3 days | Status colour is consistent; the accent stops fighting itself |
| **C** ⚠️ mostly done | `U2.1`–`U2.4` | ~4–6 days | The app becomes navigable; Suppliers appears. Materials CRUD in `ResourceList` is the one piece left open |
| **D** ✅ done | `U3.1`–`U3.3` | ~3–4 days | Uniform iconography; status glyphs replace the wall of pills |
| **E** ✅ done | `U4.1`–`U4.4` | ~2–3 days | Descriptions and notes become genuinely comfortable to read |
| **F** ✅ done | `U5.1`–`U5.3` | ~5–8 days | Six list patterns become one |
| **G** | `U6.1`–`U6.5` | ~5–7 days | The app feels fast and rewards poking around |
| **H** ⚠️ mostly done | `U7.1`, `U7.3` | ~2–3 days | Login and empty states match the rest; `U7.2` deferred to a future dashboards/reporting milestone |

Batches A, B, D, E and F are self-contained and reversible. C is the pivot. G is optional in the sense that nothing breaks without it — and it is the batch most directly aimed at what you actually asked for.

### If you only do three things

1. **`U1.3` — delete the shadows** (half a day). Four edits. The largest visual change per unit of effort in the whole document.
2. **`U2` — the shell** (about a week). Without navigation there is nothing to browse, and every other improvement is trapped on a page nobody can find.
3. **`U6.3` — the command palette** (two days). The single feature most likely to make someone open the app for the pleasure of it.

---

## Part 6 — Risks and honest caveats

1. **This plan breaks two constraints you set earlier**: new dependencies (**D-A**, **D-B**) and "no large rewrites" (`U2`, `U5.2`). Both were raised explicitly and both are now approved, so the relevant risk is no longer scope creep but review size — `U2.1` and each `U5.2` migration should stay one PR each.

2. **`ProjectDetail.tsx` is 1,352 lines with 32 `useState` hooks.** `U4.3` and `U5.2` both touch it heavily. Doing `S27` (active section in the URL) or `D1` (per-record routes) *first* would make both materially safer. This is a real sequencing decision, not a formality.

3. **The test baseline is red** — 27 failures across 10 files, pre-existing and documented in `S0`. Six of those files are ones `U3`, `U4` and `U5` will touch. Re-capture the baseline before batch D or a real regression will hide in the noise.

4. **Nothing here is measured.** The review had screenshots at 1440px and 390px from a mocked run; this plan is built on those plus your Linear references. Steps marked 👁 need a visual check at both widths — the density changes in `U1.2` in particular can look right at 1440px and cramped at 390px.

5. **`U7.2` and `U4.3` encode product opinions I shouldn't make alone** — what a renovator checks daily, and which task properties earn a place in the rail. Worth fifteen minutes of conversation before either is implemented.

6. **Dark mode is not proposed** and not scheduled. `U1.4` is written so that it becomes a token-swap exercise later rather than an audit of 50 hardcoded surfaces, which is the cheapest possible way to keep the option open.
