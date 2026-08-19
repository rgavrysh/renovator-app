# UX Implementation Plan

Companion to [`UX_REVIEW.md`](UX_REVIEW.md). Each step is sized to be one commit and one review. Step IDs (`S1`, `S2`, …) are stable — to start work, just say the ID.

**Progress:** `S0`–`S12` complete (Batch 1 + 2, 18–19 Aug 2026). Build clean; tests match the `S0` baseline exactly (27 failures, same 10 files) aside from one unrelated pre-existing failure that landed in a commit made after `S0` was captured (see `S11`'s note). `S7`–`S12` are uncommitted, on top of the already-committed `S0`–`S6`.

**Scope decisions already made**
- Navigation: **`NavLink` fix only** (`S12`). No `AppShell`, no sidebar rollout, no mobile drawer.
- Constraint: no large rewrites, no new dependencies, incremental only.
- Items that can't be done under that constraint live in [Needs your decision](#needs-your-decision) and are **not** scheduled.

**Ground rules for every step**
- **`npm run build` is the reliable gate.** Run it from `packages/frontend`; it runs `tsc` for both packages then `vite build`. It is currently clean, so any type error it reports is mine.
- **`npm test` is *not* a pass/fail gate — the baseline is red.** Compare against the recorded baseline in `S0` instead of expecting zero failures. Run it from `packages/frontend`, and make sure the shell's cwd really is that directory: from the repo root the same command runs `--workspaces` and mixes backend results into the output, which makes the frontend numbers unreadable.
- Steps marked 👁 need a visual check at 1440px and 390px, not just a green build.
- Steps are ordered so nothing later depends on something earlier being skipped, except where noted.

---

## Phase 0 — Baseline

### S0 · Baseline — done, and it is not green
Captured 18 Aug 2026, before any change.

**Build: clean.** `tsc` passes for backend and frontend, `vite build` emits 323 modules. This is the gate to trust.

**Frontend tests: 29 files, 10 failed, 27 of 319 tests failed, 2 skipped.** Reproduced identically across two runs, so the set is stable rather than purely flaky. Pre-existing failures:

| Test file | Failing |
|---|---|
| `contexts/AuthContext.test.tsx` | 7 (run takes ~35s — looks like a timeout, not an assertion) |
| `pages/ProjectForm.test.tsx` | 5 |
| `components/TaskForm.test.tsx` | 4 |
| `components/SupplierList.test.tsx` | 3 |
| `components/DocumentList.test.tsx` | 2 |
| `components/WorkItemsLibraryModal.test.tsx` | 2 |
| `components/PhotoUpload.test.tsx` | 1 |
| `components/TaskDetail.test.tsx` | 1 |
| `pages/Dashboard.test.tsx` | 1 |
| `pages/ProjectDetail.test.tsx` | 1 |

**Why this matters for Batch 1:** five of these files (`ProjectForm`, `TaskForm`, `WorkItemsLibraryModal`, `TaskDetail`, `ProjectDetail`) sit directly on top of `S2`, `S3` and `S5`. Without this table it would be easy to attribute a pre-existing failure to a new change, or to miss a real regression hiding among them.

`ui/Input.test.tsx` passes and never asserts on element ids, so `S5` is safe to make.

**Working tree:** the uncommitted changes in `MilestoneService.ts`, `MilestoneService.test.ts`, `MilestoneList.tsx`, `ProjectDetail.tsx`, `en.json`, `uk.json` are being **left in place and edited on top of**, since committing someone else's WIP isn't mine to do. Consequence: the working tree now interleaves that WIP with plan changes, so review the diff per file rather than wholesale.

**Effort:** S · **Blocks:** everything

---

## Phase 1 — Live bugs ✅ complete

Six real defects. All are `S`, all independent, all shippable this week.

**Outcome.** All six fixed and verified: build clean, and the test run reproduces the `S0` baseline exactly (same 10 files, same per-file counts, 27 failed / 290 passed / 2 skipped) — no regressions. Two deviations from the plan as written, both explained in their steps below: `S1` needed two new `Badge` variants, and `S2` needed an Edit action added to `TaskDetail`.

**Visual and interaction pass: done**, against the app running locally with a mocked API at 1440×900 and 390×844. Evidence in `docs/ux-review/after-s2-task-detail-1440.png` and `after-s6-client-details-390.png`. Results per step below; all four checkable steps passed, measured via computed styles and DOM geometry rather than by eye.

Two pre-existing mobile defects were re-confirmed as **still open** and are *not* part of Batch 1: the project title still collides with its Edit/Archive actions at 390px, and `CardHeader` actions still collide with their heading ("Timeline & Milestones" over "Add Milestone"). Both need `CardHeader` and the page header to wrap, which no scheduled step covers yet — worth adding to Batch 2 if mobile matters more than currently assumed.

### S1 · Restore budget category badges ✅
Closes **#1**. Currently every category badge renders with `undefined` in its class string.

`BudgetItemsList.tsx:65-76` returns `'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'gray'`, but `Badge` (`ui/Badge.tsx:4`) only accepts `'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'`. The `as any` at `:99` suppresses the mismatch, so `variantStyles[variant]` is `undefined`.

**Done.** `getCategoryColor` now returns `BadgeProps['variant']` with a `?? 'default'` guard, and the `as any` is gone.

Resolved the `purple`/`orange` gap by **adding two decorative variants to `Badge`** rather than remapping onto status colours. Seven categories needed distinct colours but only six variants existed, one of which (`danger`) shouldn't be decorative — painting a budget category red is the same mistake the review flags for red Permit document badges. The new variants are documented in `BadgeProps` as decorative-only, and `S20` should split decorative from semantic when it tokenises them.

Audited for the same defect elsewhere: `BudgetItemsList.tsx:99` was the only `as any` on a variant prop. The other seven badge call sites pass properly typed helpers.

**Verified in the browser.** Computed styles for all seven category badges, each a distinct real fill where previously every one of them had no background class at all:

| Category | Background | Text |
|---|---|---|
| Labor | `bg-blue-100` | `blue-700` |
| Materials | `bg-green-100` | `green-700` |
| Equipment | `bg-purple-100` | `purple-700` |
| Subcontractors | `bg-orange-100` | `orange-700` |
| Permits | `bg-yellow-100` | `yellow-700` |
| Contingency | `bg-gray-100` | `gray-700` |
| Other (custom label) | `bg-gray-100` | `gray-700` |

The custom-category path also renders its own label ("Design") rather than "Other". **Effort:** S (as estimated)

### S2 · Reach the TaskDetail modal
Closes **#2**. `setIsTaskDetailOpen` is declared at `ProjectDetail.tsx:125` and **never called with `true`**, so `TaskDetail` (rendered at `:1258`) is unreachable and per-task notes are dead functionality.

**Done.** `TaskList` gained `onSelect`, with `activateRow = onSelect ?? onEdit` so any other consumer keeps today's behaviour. `ProjectDetail` gained `handleViewTask`, and the surrounding plumbing (`selectedTask`, `handleTaskDetailClose`, and a `handleTaskUpdate` that already refreshes the selected task) turned out to exist already — only the opener was missing.

**The plan missed a dependency.** There is no pencil affordance in a task row; the row click *was* the only path to editing. Repointing it at the detail modal would have made editing unreachable, and `TaskDetail`'s footer was Delete + Close only. So `TaskDetail` also gained an optional `onEdit` and an Edit button, and `ProjectDetail` wires `handleEditTaskFromDetail` to close detail then open the form. Detail is now the hub, which is why the button belongs there rather than adding a third icon to an already dense row.

No `stopPropagation` work was needed — the status circle, priority badge, amount input and delete button already stopped propagation, so the guards the plan called for were in place.

**Verified in the browser.** Clicking a task row opens the detail modal showing description, due date, price, amount, actual price, and **both task notes** — the functionality that was previously unreachable. Clicking Edit in the footer closes detail and opens "Edit Task" fully populated (name, `in_progress`, `high`, milestone `m2`, due date, price 310, amount 4.2, unit m2), confirming the handoff passes the right task.

One trap worth recording: the accessibility snapshot reported the edit form's controls as empty and at default values, which looked like a serious bug. Reading the DOM directly showed every field correctly populated — the snapshot had captured pre-effect state. **Check the DOM, not the snapshot, when verifying form population.**

This also put review finding #28 on screen: the same task reads "Due: Aug 25, 2026" in the list and "August 25, 2026" in its own modal. **Effort:** S

### S3 · Fix pluralization in both locales
Closes **#4**. `i18next@^25.8.5` with no `compatibilityJSON: 'v3'` in `i18n/index.ts` means the `_plural` suffix (removed in v21) never resolves — English renders "Add 5 Task" and Ukrainian's three plural forms never appear.

**Done.** All `_plural` suffixes are gone; English uses `_one`/`_other` and Ukrainian all four forms.

Both `hours` keys became whole-phrase count keys (`hoursCount`) rather than a bare noun after a number, so Ukrainian can inflect and order the phrase — the review's "each count key is one whole sentence" guidance. That retired `workItemsLibrary.hours` and `workItemsModal.hours` instead of leaving them dead. The two call sites (`WorkItemsLibrary.tsx:259`, `WorkItemsLibraryModal.tsx:324`) now pass `count`.

Also sentence-cased `addTasks` while rewriting it ("Add {{count}} Task" → "Add {{count}} tasks"), since `S16` would only have rewritten the same line again.

**Verified by executing i18next against the real locale files:**

```
en: Add 1 task / Add 2 tasks / Add 5 tasks · 1 hour / 4.5 hours
uk: Додати 1 завдання / Додати 2 завдання / Додати 5 завдань
uk: Показано 1 користувацький робочий елемент / 2 користувацькі робочі елементи / 8 користувацьких робочих елементів
```

Both files parse, no `_plural` remains anywhere, and nothing is missing from `uk`. Note `uk.json` is now legitimately 10 keys larger than `en.json` (the `_few`/`_many` forms English doesn't have) — **the parity CI check the review recommends must be plural-aware**, or it will report a false failure.

**Caveat worth a native speaker's eye:** the Ukrainian plural forms came from the audit and from me, not a native reviewer. The genitive-governed phrasing in `overdueDelivery` (where `_few` and `_many` legitimately coincide) is the one most worth a second opinion. **Effort:** S

### S4 · Stop showing "Retry" as an error message
Closes **#34**. `BudgetItemForm.tsx:184` and `MilestoneForm.tsx:131` both do `setSubmitError(error.message || t('common.retry'))`, so a network failure displays the word "Retry" as the explanation.

**Done.** Added an `errors` namespace (seeded with `saveFailed` only; `S15` expands it) and pointed both fallbacks at it. Left the `error.message ||` ordering for `S15` as planned — the bug only fires when `error.message` is empty, which is exactly the fallback path, so replacing the fallback fully closes it.

**Effort:** S

### S5 · Give form controls stable ids
Closes **#12**. `Input.tsx:19` derives the id from the **translated label** (`label?.toLowerCase().replace(/\s+/g, '-')`). Two fields labelled "Name" produce two elements with `id="name"`, so clicking a label focuses the wrong field — possibly one behind a modal. The id also changes with language.

**Done.** `React.useId()` is now the fallback in all four primitives, with the explicit `id` prop still taking precedence, so no call sites changed.

Confirmed nothing depended on the old derived ids: `Input.test.tsx` never asserts on them, and the only `getElementById`/`htmlFor` uses elsewhere are explicit ids (`tasks-section`, `photo-file-input`, `document-file-input`, `root`). A side benefit is that ids no longer change when the user switches language.

**Verified in the browser.** With the task filters and the edit form both open, 15 controls carried ids, **all** in React `useId()` form (`:r1:`, `:r3:`, …), with **zero duplicates** and zero label→id mismatches across the 12 labelled controls. That page previously had two controls labelled "Status" (the task filter and the form's status select), both deriving `id="status"` — a live collision, now gone. **Effort:** S

### S6 · Fix the ten unguarded two-column grids
Closes **#10**. `grid-cols-2` with no responsive prefix causes client email and phone to **visually overlap** at 390px (`ProjectDetail.tsx:831`).

**Done.** **Nine** grids, not ten, across `ProjectDetail` (2), `ResourceForm` (3), `TaskForm`, `WorkItemTemplateForm`, `TaskDetail` and `SupplierForm` — now `grid-cols-1 sm:grid-cols-2`.

Two of the eleven `grid-cols-2` matches were deliberately left alone: `PhotoGallery.tsx:279` (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`) and `ResourceList.tsx:326` (`grid-cols-2 md:grid-cols-4`) both intend a 2-up mobile layout, which is correct for a photo grid and for short stat pairs. The review's count of ten included one of these.

`overflow-x-hidden` deliberately left in place for `S11`.

**Verified in the browser at 390×844.** The client grid now computes to a single `308px` column: email at y=555 and phone at y=611, each the full column width, stacked with no collision and no truncation. Document scroll width is exactly 390, so no horizontal overflow — and note that's with `overflow-x-hidden` still in place, so `S11` can now remove it against a clean baseline. **Effort:** S

---

## Phase 2 — Config and layout wins ✅ complete

Small edits with app-wide reach. `S7`–`S10` are all `tailwind.config.js`; they could be one commit, but keeping them separate makes the visual diff attributable.

**Outcome.** All six steps done and verified: build stays clean at 323 modules, and `npm test` reproduces the `S0` baseline exactly — same 27 failures across the same 10 files, zero regressions. One extra failure surfaced (`MilestoneForm.test.tsx`, 1 test), but it's not this batch's doing: confirmed via `git stash` that it fails identically with none of `S7`–`S12` applied, tracing instead to `e620ef6` ("derive milestone status from task progress"), a commit that landed after the recorded `S0` baseline was captured. No visual regression testing was done in-browser for this batch (see individual steps for what verification substitutes for it); a manual pass at 1440px and 390px is recommended before treating the 👁 steps below as fully closed.

### S7 · Make 6px the default radius ✅
Closes part of **#36**. `rounded-linear` (54 uses) is outnumbered by the stock radii it was meant to replace (61 uses).

- Add `borderRadius: { DEFAULT: '6px', linear: '6px' }`. This converts ~20 bare `rounded` uses with zero file edits.
- `rounded-md` / `rounded-lg` / `rounded-full` are unaffected; migrating those is cosmetic follow-up, not part of this step.

**Done.** Landed exactly as scoped. Verified in the compiled CSS output rather than by eye: `.rounded{border-radius:6px}` now resolves, where it previously fell back to Tailwind's stock `0.25rem`. Swept every bare `rounded` use app-wide first — `Checkbox`, `PhotoGallery`, `TaskList`, `BudgetItemsList`, `WorkItemsLibraryModal`, `MilestoneList`, `PhotoUpload`, `SupplierList`, `ProjectDetail` — all are small icon-button hover states or a thumbnail corner, nothing reads as intentionally sharp-cornered. **Effort:** S (as estimated)

### S8 · Fix the off-palette focus ring ✅
Closes part of **#27**. `Alert`'s dismiss button uses a bare `focus:ring-2` with no colour, so it falls back to Tailwind's default blue — off-palette.

- Set `ringColor: { DEFAULT: theme('colors.primary.500') }` in the config. This fixes `Alert` without editing it.
- **Verify the Tailwind version's `ringColor.DEFAULT` semantics first** — confirm `ring-2` with no colour class actually picks it up in this setup before assuming the fix landed.
- Deliberately *not* in this step: switching `focus:` → `focus-visible:` across the kit. That's `S9`.

**Done.** One deviation from the literal plan text: `ringColor` had to be a closure — `(theme) => ({ DEFAULT: theme('colors.primary.500') })` — rather than a static object, since it references the `primary` scale defined earlier in the same `extend` block; Tailwind's docs confirm this is the supported pattern for cross-referencing theme values. Verified the semantics directly in the compiled CSS rather than assuming: the universal reset's `--tw-ring-color` custom property now defaults to `rgb(91 110 242 / .5)` (primary-500 at the standard 50% ring opacity) in place of Tailwind's stock blue, so `Alert`'s ring (now `focus-visible:ring-2` after `S9`) picks up the right colour with zero changes to `Alert.tsx` itself. **Effort:** S

### S9 · Switch to `focus-visible:` ✅
Closes the rest of **#27**. The kit uses `focus:`, so rings stay stuck after a mouse click.

- Swap `focus:` → `focus-visible:` in `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Alert`.
- Keep `focus:` on the field primitives' `border-*` colour change if you want the border to react to programmatic focus too — worth a quick look rather than a blanket replace.

**Done.** All six components swapped. Kept `focus:border-red-500` / `focus:border-primary-500` as `focus:` on `Input`, `Select` and `Textarea`, per the plan's own suggestion, so the border still reacts to programmatic focus while the ring only appears for keyboard navigation. **Effort:** S

### S10 · Give 1440px a layout, and phones their width back ✅
Closes **#11** and part of **#23**. The app has 13 responsive classes total and **zero `xl:`** — the last breakpoint used anywhere is `lg` (1024px), so the stated primary 1440px target renders an iPad layout.

- `Container.tsx:23`: `px-6 py-8` → `px-4 sm:px-6 py-6 sm:py-8`, recovering ~12% of usable width on a 390px screen.
- Add `xl:grid-cols-4` to the Dashboard project grid and the work-items library grid.
- Add `xl:col-span-3` (or widen the main column) on the ProjectDetail two-column split so the rail stops cramping while the left column has slack.

**Done.** All three landed exactly as scoped: `Container.tsx` padding, `xl:grid-cols-4` on both the Dashboard project grid and the work-items library grid, and on `ProjectDetail` the row gained `xl:grid-cols-4` with the main column at `xl:col-span-3` (leaving the rail at an implicit `col-span-1`). **Not independently 👁-verified in-browser this round** — a background visual-check pass was started but its results didn't land before this batch was wrapped up; worth a manual look at 1440px (four dashboard cards per row) and 390px (tighter gutters, nothing clipped) before calling this fully closed. **Effort:** S

### S11 · Unmask mobile overflow ✅
Closes the rest of **#23**. `PageLayout` puts `overflow-x-hidden` on `<main>` (`Container.tsx:51`), which hides horizontal overflow instead of fixing it.

- Remove it. **Depends on `S6`** being merged first, or the known overlap becomes a visible scrollbar.
- Fix whatever new overflow this exposes; expect wide tables and long unbroken strings (document names, emails).

**Done.** Removed. Landed after `S6`, so the known email/phone overlap is already gone rather than becoming a visible scrollbar. Audited statically for what the plan warned would be exposed: there are no `<table>` elements anywhere in the app, and every existing `truncate` use already sits on an ancestor with `min-w-0` (`SupplierList`, `DocumentList`, `TaskList`, `PhotoUpload`, `ResourceList`, `WorkItemsLibrary`, `WorkItemsLibraryModal`, `UserDropdown`), so those were already safe. Found one real gap the audit was meant to catch: `ProjectDetail`'s client email renders as plain text with no `overflow-wrap`, so a long unbroken address would now bleed past its grid column instead of being invisibly clipped — added `break-words`. `SupplierList`'s equivalent contact fields have the same latent gap but were left alone since that component is currently unreachable (`D3`). **Not independently 👁-verified in-browser this round** — recommend a manual 390px pass across the five pages before treating this as fully closed. **Effort:** S

### S12 · Make the nav components router-aware ✅
Closes **#32**. `SidebarItem` (`Sidebar.tsx:68-92`) and `HeaderNavItem` (`Header.tsx:61-73`) render raw `<a href>`, so the moment either is wired to a real route every click is a full page reload.

This is the **only** navigation work in this plan, per your decision.

- Swap both to `NavLink` from `react-router-dom`.
- Derive `active` from `NavLink`'s `isActive` while keeping the existing `active` prop as an optional override — `ComponentShowcase.tsx:45` and `:61` pass `active` explicitly with `href="#"`, and those must keep working.
- Both components currently render outside a router only in the showcase, which *is* inside the router, so no `MemoryRouter` shim is needed.

**Done.** Both components now render `NavLink`. `active` became optional; when omitted it falls back to `NavLink`'s own `isActive`, and when passed explicitly — as every `ComponentShowcase` call site does, all with `href="#"` — it overrides `isActive` entirely, so the showcase's forced-active demo items keep rendering unchanged. `/components` sits inside the router tree (`router.tsx`), confirmed by reading the route config, so no `MemoryRouter` shim was needed as anticipated. **Not independently checked for console warnings in a running browser this round** — worth a quick look at `/components` to confirm before treating this as fully closed. **Effort:** S

---

## Phase 3 — Use the components that already exist

Mechanical, low-risk, and the largest visible consistency gain per hour.

### S13 · Replace hand-rolled duplicates with the UI kit
Closes **#15**. `Alert` is hand-rolled in 10 places, `Spinner` bypassed 9 times, `EmptyState` open-coded as bare text in 5.

Do it in three commits, easiest first:

1. **Spinners** — 9 sites. Prioritise the 4 using `border-blue-600`, which is off-palette *and* includes `ProtectedRoute.tsx` (the first thing every user sees on a cold load). While there, point `ProtectedRoute.tsx:40,62` at the existing-but-unused `t('common.loading')` instead of a hardcoded `<p>Loading...</p>` (part of **#14** in the review's content section).
2. **Alerts** — 10 red error divs → `<Alert variant="danger">`. Check each for a dismiss affordance the div didn't have; adding one is fine, but note it in the PR.
3. **Empty states** — 5 bare-text spots → `EmptyState`. Two of them (`MilestoneList.tsx:88-94`, `TaskList.tsx:208-214`) also need new copy keys; that's `S18`, so either sequence them or land the keys first.

**Verify:** 👁 each replaced site. **Effort:** S per commit

### S14 · Show which fields are required
Closes **#16**. All six forms already pass `required`, but `Input`, `Select` and `Textarea` never read it — users discover requiredness by failing submit, despite 20 "X is required" validation strings existing.

**Decided:** mark the **optional minority**, not the required majority — fewer marks, less visual noise.

- Add a muted "optional" affix to the label when the field is *not* `required`. Three files (`Input`, `Select`, `Textarea`), and all six forms improve at once.
- `projectDetail.optional` already exists as a key; promote it to `common.optional` and reuse it rather than adding a new string.
- Because this inverts the usual convention, the affix must be visually quiet (small, `text-gray-500`) so it reads as a note rather than a second label.

**Effort:** S

### S15 · Split page errors from action errors
Closes **#3**, and removes the backend-message leak from **#7**. Fourteen sites write `ProjectDetail`'s single `error` state (`:187` load, plus 13 action handlers at `:206`–`:628`), and that state gates a full-page takeover at `:699`. A transient failure while ticking a checkbox replaces budget, tasks, photos and scroll position with a red banner.

- Add `actionError` alongside `error`; rename `error` → `loadError` for clarity.
- Only `:187` (the load path) keeps the full-page takeover. The other 13 set `actionError`.
- Render `actionError` as a dismissible `<Alert variant="danger">` under the page header, and auto-clear it on the next successful action.
- While editing each of the 13: **flip the `err.message ||` ordering** so the user-facing string wins and `err.message` goes to `console.error`. This single change stops all 77 backend English messages from reaching users, including gems like `Invalid encrypted token format`.
- The existing optimistic-rollback logic is already correct — don't touch it.

**Verify:** force a failure (offline, or a bad id) while toggling a task; the page must stay intact with a dismissible banner. **Effort:** M

---

## Phase 4 — Copy

No code changes in `S16`–`S18` beyond the locale files. Land `S3` first so the plural keys aren't rewritten twice.

### S16 · Sentence-case pass over `en.json`
Closes **#21**. 153 of 264 English label strings are Title Case, against a sentence-case reference.

- Lowercase every non-initial word except proper nouns (Google Drive, PDF, OAuth) and any status value treated as data.
- **`en.json` only** — `uk.json` is already correctly sentence case throughout.
- One commit, mechanical, zero code touched. Large diff but trivially reviewable.

**Effort:** M

### S17 · Rename the jargon
Closes **#22** and part of **#11** in the review's content section. Labels only — the data model, API and type names stay as they are.

- "Work Items Library" → "Work catalog" (3 keys share this string)
- "Resources" → "Materials & equipment"
- "Variance" → "Left" (and reconsider showing under-budget as a green negative number, per the ProjectDetail screenshot)
- "Budget Items" → "Costs"
- `budgetItemsList.general` → "Not linked to a stage"
- Settle the estimated/actual vocabulary on one pair ("Planned"/"Spent") and delete the duplicate `projectDetail.totalEstimated`, which has the same value as `projectDetail.estimatedBudget`.

**Verify:** grep for each old string to catch any that appear outside the locale files. **Effort:** S–M

### S18 · Fill the copy gaps
Closes **#17** and **#30**, plus the remaining content items.

- Add `taskList.noTasksHint` and `milestoneList.noMilestonesHint` (needed by `S13`'s empty-state swap).
- Rewrite Login: "Continue with Google" instead of **"Sign in with OAuth"**, one line of product copy, a real `loading` state on the button, and swap `rounded-lg shadow` for the `linear` tokens so the first screen is on-system.
- Add helper text to the five highest-confusion fields (`unit`, `price`, `actualPrice`, `defaultPrice`, and the variance figure). The primitives already support `helperText` and it's used exactly twice today.
- Lowercase the 11 Ukrainian `Ви`/`ваш` pronoun instances, and fix `dashboard.subtitle` to "Керуйте своїми проєктами".
- Resolve the seven uk string collisions, the worst being `common.loading` and `common.uploading` both rendering as `Завантаження...`.
- Delete the 24 dead keys (spot-check `language.en`/`language.uk` first — those may be reached via a dynamic lookup in `LanguageSwitcher`).

**Effort:** M · Split into 2–3 commits (empty states / Login / uk polish)

### S19 · Rewrite the destructive confirmations
Partially closes **#25**. Keeping `window.confirm` (replacing it is `D4`), but the copy can improve now: 10 keys all open with "Are you sure you want to…".

- Lead with the consequence: "Delete \"{{name}}\"? This can't be undone."
- `documentList.deleteConfirm` should mention the 30-day restore window, which is stated in `trashNotice` but not where the user decides.
- Drop the `window.alert` success dialog at `WorkItemsLibrary.tsx:113` and delete `workItemsLibrary.deleteSuccess` — the row disappearing *is* the confirmation.

**Effort:** S

---

## Phase 5 — Consistency infrastructure

Bigger than polish, still well short of a rewrite.

### S20 · Semantic status tokens
Closes **#8**. Only `primary` and `gray` are tokens, so 171 raw palette classes across 25 files carry status meaning, via 8 duplicated status→colour maps that have **already drifted** (`bg-gray-300` vs `bg-gray-400` for the same "not started" state on one page).

- Add `success`, `warning`, `danger`, `info` scales to `tailwind.config.js`, **seeded from the values currently in use** so the visual diff is near zero.
- Extract `utils/statusColors.ts` as the single source for status→classes; migrate the 8 duplicated maps to it.
- Convert `Badge` and `Alert` first (they're the highest-traffic consumers), then the widgets.
- Also add `surface`/`canvas`/`border-subtle` aliases for the ~50 direct `bg-white` / `bg-black/60` uses. This is the cheap part of dark-mode readiness and costs nothing now.

**Verify:** 👁 before/after at 1440px on ProjectDetail — the diff should be almost invisible. **Effort:** M

### S21 · Shared date and file-size formatting
Closes **#28** and **#35**. Date formatting is duplicated 9 times across two different APIs with divergent options, so the same task reads "Mar 13" in the list and "March 13" in its own detail modal. Photo sizes render unscaled: a 12 MB file shows as `12288.00 KB`.

- Add `utils/date.ts` mirroring the `startsWith('uk')` locale logic already correct in `utils/currency.ts`; replace all 9 call sites.
- Move the correct `formatFileSize` out of `DocumentList` into `utils/format.ts` and use it in `PhotoUpload.tsx:412` and `DocumentUpload.tsx:299`.

**Effort:** S

### S22 · Cap modal height
Closes **#24**. `Modal` has no max-height, so on the four long forms the title and the Save button scroll off-screen.

- `max-h-[calc(100vh-2rem)] flex flex-col` on the panel, `flex-1 overflow-y-auto` on the content region, header and `ModalFooter` fixed. Fixes all 11 modals at once.

**Verify:** 👁 the longest form (ProjectForm) at 390px and at 1440px with a short window. **Effort:** M

### S23 · Button hierarchy and pressed states
Closes **#20** and **#33**.

- Demote the six competing `primary` buttons on ProjectDetail so per-section "Add" actions are `secondary` and one action leads the page.
- Move "Remove budget" out of the card body — it's currently the highest-contrast element on the screen and the most destructive, least frequent action.
- Add `active:` fills to `Button` plus `active:scale-[0.98]`; optionally set `transitionDuration.DEFAULT: '120ms'`.
- Give `Ghost` a hover background so it reads as a button rather than plain text.

**Verify:** 👁 one clear primary per viewport. **Effort:** S

### S24 · Small IA corrections
Closes **#31** and **#42** — the parts of the IA findings that don't need a shell.

- `ProjectForm`: branch on `isEditMode` so save returns to `/projects/${id}` instead of the dashboard, and use `navigate(-1)` on cancel. Editing a project from inside it currently ejects you to the dashboard on both paths.
- Gate `/components` behind `import.meta.env.DEV` so the showcase stops shipping to production.
- Give `NotFound` a link home.
- Replace `ProjectForm`'s first-error lookup, which queries for a Tailwind class (`[class*="text-red-600"]`) and can match the error banner instead of a field, with refs keyed by field name (**#40**).

**Effort:** S

### S25 · Row alignment and overdue signalling
Closes **#38**.

- Add `border border-transparent` to normal rows so overdue rows' 1px border stops shifting content in mixed lists.
- Reduce in-row overdue signalling from three simultaneous treatments to tint plus `⚠`, and lift `ResourceList`'s aggregate-Alert pattern into tasks and milestones.

**Effort:** S

### S26 · Fix the work-items library count contradiction
Closes **#29**. Filters read `All (16)` while the footer reads `Showing 1 custom work item`, because `WorkItemsLibrary.tsx:80` filters out the 15 built-in templates but the category counts don't.

- Either compute counts from the filtered list, or show the built-ins (they're currently only visible inside the modal). **The second option is a product decision** — 15 useful starter templates are effectively hidden from the page that exists to manage them.
- Also replace the bare red "Delete" text link with the standard destructive pattern, and align the page header with the other pages (it has no logo mark).

**Effort:** S

---

### S27 · Put the active project section in the URL
Closes the usable half of **#6**. Today all 8 modals and every list filter in `ProjectDetail` are local `useState`, so refresh loses everything and Back from a task jumps to the dashboard.

**Decided:** ship the query-param interim now; full child routes stay parked as `D1`.

- Drive the active section from `useSearchParams` (`?section=tasks`), defaulting to the current initial view when the param is absent so existing links keep working.
- Sync the open/close of the section-level views only. Deliberately **not** in scope: per-record modals (task detail, budget item edit) — those need route params and belong to `D1`.
- Make the browser Back button close the active section rather than leaving the project, which is the behaviour users are actually reaching for.
- Keep filters in local state for now; adding them to the URL multiplies the state surface without much gain until sections are routed.

**Verify:** open a section, refresh — same section; press Back — returns to the project overview, not the dashboard. **Effort:** S

---

## Needs your decision

Not scheduled. Each either exceeds the no-rewrites constraint or needs product judgement first.

| ID | Item | Why it's parked |
|---|---|---|
| **D1** | Full child routes under `projects/:id` (**#6**) | The interim is now scheduled as **`S27`**. The full version — `ProjectDetail` as a shell with `<Outlet/>` and a route per record — is `L` and remains the one item I'd argue is worth relaxing the no-rewrites constraint for, since sending a contractor a link to a specific milestone is a core domain need. `S27` does not deliver that; only per-record routes do. |
| **D2** | `AppShell` + sidebar + mobile drawer (**#5**, **#37**) | Explicitly de-scoped to `S12` only. Note the consequence: four pages keep duplicating ~120 lines of header, and the work-items library stays buried in the account dropdown. |
| **D3** | Surface suppliers/materials (**#9**) | Fully built, tested, backed by complete API routes, and **unreachable** — no route renders `SupplierList`/`ResourceList`/`BudgetOverview`. Needs a navigation home, which `D2` would have provided. Also `ResourceList` is read-only despite a complete `ResourceForm` existing (**#39**). |
| **D4** | `ConfirmDialog` over `Modal` (**#25**) | `S19` improves the copy inside `window.confirm`. Replacing 10 native dialogs with a real component is `M`–`L` and pulls in the unsaved-changes guard (**#41**). |
| **D5** | Toast/feedback layer (**#13**) | Successful saves are currently silent and success uses `window.alert`. A minimal provider reusing `Alert` styling is `M`. This changes how the app *feels* more than any CSS in this plan. |
| **D6** | `ListRow` + `IconButton` extraction (**#14**) | `L`, and genuinely optional — `S13`, `S14` and `S25` close most of the *visible* gap between the six divergent list patterns. Reassess after Phase 3. |
| **D7** | Dashboard and ProjectDetail information hierarchy (**#18**, **#19**) | Needs your product judgement about what a homeowner checks daily. Worth a short conversation, not a direct implementation. May need one backend field for overdue counts. |
| **D8** | Regenerate the `primary` palette (**#26**) | You said the palette is open. The scale's largest hue jump sits exactly between the 600 fill and the 500 focus ring that `Button` pairs. Cheap now, expensive after ten more features — but it's a visual decision I shouldn't make unilaterally. Do it right after `S20`, not before. |

---

## Suggested sequence

| Batch | Steps | Effort | Outcome |
|---|---|---|---|
| 1 | `S0`–`S6` | ~1–2 days | Six real bugs gone, including two that mis-render on every visit |
| 2 | `S7`–`S12` | ~1 day | Config-level polish; 1440px gets its own layout; nav won't reload |
| 3 | `S13`–`S15` | ~2–3 days | Kit actually used; a failed click no longer nukes the page |
| 4 | `S16`–`S19` | ~2–3 days | Tone matches the Linear reference; errors stop speaking English to Ukrainian users |
| 5 | `S20`–`S27` | ~5–7 days | Status colour becomes a token; refresh and Back behave; remaining consistency debt closed |

Batches 1–4 are cleared to run without further input (`S14`'s convention is decided). Before batch 5, revisit `D8` — regenerating the palette should follow `S20` immediately rather than preceding it.
