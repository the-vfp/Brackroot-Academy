# Changelog

All notable changes to Brackroot Academy are documented here.

## 2026-04-24 — VN-style sprites + show/hide directives in heart events

### Added
- Heart event overlay now supports per-line sprite swaps via Obsidian-wikilink syntax:
  - `[[SpriteName.png]] Speaker: body` — dialog line that swaps the speaker's sprite.
  - `[[SpriteName.png]]` on its own paragraph — show/change a sprite without a dialog beat.
  - `[[hide Marlow]]` / `[[hide]]` — hide a specific character or clear both slots.
  - `Speaker: body` (no wikilink) and narration paragraphs still work as before.
- MC bust slot — Ellene's sprite appears bottom-left on dialog/show lines that reference an `Ellene*.png` file. Sits flush with the top of the dialog box; speaker tab renders in front of her.
- Non-speaker dim filter — the slot that isn't speaking dims to ~65% brightness when there's a speaker, both full-bright during narration.
- Sprites are sticky (Ren'Py semantics) — once set, they persist across paragraphs until changed or hidden.
- `public/art/characters/*.png` and `public/art/backgrounds/*.png` now use PascalCase filenames to match the authoring vault (e.g. `MarlowSmile.png`, `ElleneThoughtful.png`, `DivinesCommon.png`).
- Mockup preview at `public/mockups/heart-event.html` for iterating on the layout standalone.

### Changed
- `.scene-character` sizing — 90% frame width, natural aspect, bottom: 22% (flush with dialog top). Previously capped at 80% width / 60vh height with a gap above the dialog. Pixelated/crunchy scaling removed; default smoothing restored.
- Back-compat: scripts with no `[[wikilinks]]` still render the emoji portrait fallback like before (existing Marlow Lv 1-7 events unchanged visually).

## 2026-04-23 — Emoji slot in inline add-habit form

### Added
- Inline Add Habit form gains a compact emoji input next to the name field. Defaults to ✨ if left empty; tap to pop the system emoji keyboard. Resets to the default after each successful add.

## 2026-04-23 — Inline add-habit (drop Manage Habits)

### Added
- Inline Add Habit form at the bottom of the Habits list — name input + difficulty picker + Add button. Defaults to Daily + ✨ icon. Long-press the new row afterwards to refine emoji or switch to Repeatable. Mirrors the Add Task pattern.

### Removed
- "Manage Habits" button from the Habits sub-tab.
- `HabitManager.jsx` deleted entirely — long-press-to-edit + inline add cover everything it used to do (add, edit, delete).
- Dead CSS: `.habit-manage-btn`, `.habit-manage-row`, `.icon-picker`, `.icon-option` (the old 24-emoji grid was already replaced by the emoji input).

## 2026-04-23 — Heart event redesign (Tears-of-Themis-style)

### Added
- Heart event overlay paginates by paragraph — one paragraph per "page", tap anywhere to advance, last-page tap closes. Replaces the single-scroll block + "Continue →" button.
- Speaker detection: paragraphs authored as `"Speaker Name: text..."` render with a speaker tab above the top-left corner of the dialog box; narration paragraphs (no prefix) hide the tab entirely. Tab is a clean rounded rectangle (portrait badge + level tag removed — just the name, ToT-flavored).
- Page counter in the top-right of the dialog (`4/21`) and a quiet "Tap to continue ›" / "Tap to close ✓" hint at the bottom-right.
- Inline italic rendering: `*word*` → `<em>` inside paragraph bodies, so prose like `*coping*` and `*nobody's coming.*` reads as intended instead of showing literal asterisks.
- Marlow Lv 1 heart event rewritten into ToT-paginated form with per-paragraph speakers including the "Random guy" → "Marlow" reveal at the moment he tells her his name.

### Changed
- `.scene-dialog` shrunk from 35% of viewport to ~26% min / 45% max to give the character art room to breathe — matches the ToT reference proportions.
- Dropped the `.scene-continue` button + its styles; advance-hint + tap-anywhere replaces it.
- Title (e.g. "Housemates") now shows only on page 1 as a scene-opening label, then steps aside.

## 2026-04-23 — Local-date sweep (UTC → local everywhere)

### Added
- New `localDateString(date?)` helper in `db.js` — formats a Date as `YYYY-MM-DD` using local components (not UTC). This is now the single source of truth for "today" across the app.

### Fixed
- Replaced every use of `new Date().toISOString().split('T')[0]` (17 call sites across 5 files) with `localDateString()`. The old pattern returned UTC date, which flipped a day early in the evening in negative-offset timezones — a latent bug across:
  - `db.js`: `getHabitDayFor`, `getWeekStart`, `getMonthStart`
  - `store.jsx`: expense/meal/interaction dates, habit streak today/yesterday comparison, export JSON filename
  - `HabitChecklist.jsx`: calendar-today check for the "New Day" button
  - `LogExpense.jsx`, `MealTracker.jsx`: date input defaults and reset values
  - `TaskView.jsx` already used a local helper from the previous fix; swapped it to the shared one and deleted the local copy
- Same fix applies to the yesterday computation in `store.jsx` (`Date.now() - 86400000` → local-arithmetic yesterday).

### Migration note
- After this lands, on first load the auto-rollover may stamp `habitDay` back to local-today if the previously-stored value was UTC-today. Any habit logs written during the UTC/local crossover window carry UTC-dated stamps and will no longer match "today" after the fix. For the author's test data this was a one-time re-sync; for real user data the impact is limited to late-evening-written records.

## 2026-04-23 — Scheduled + recurring tasks; bucketed sections

### Added
- Tasks can be scheduled for a specific date (`dueDate`) or set to repeat weekly on a chosen day-of-week pattern (`recurrence: { type: 'weekly', days: [0..6] }`). Modes are mutually exclusive — picking one clears the other.
- `SchedulePicker` component: 3-mode segmented (Anytime / On date / Weekly). "On date" expands a native date input; "Weekly" expands a 7-chip day-of-week selector (S M T W T F S).
- Picker is wired into both the Add Task form and the inline Edit form.
- Tasks now render in four buckets: **Overdue** (one-off, dueDate < today), **Today** (no date, due today, or recurring on today's DOW), **Upcoming** (one-off, due > today, sorted by date — and recurring tasks on non-applicable days, slotted in by their next-occurrence date), **Completed**. Each row shows a schedule chip — `📅 Apr 25` or `🔁 Mo We Fr` (with shorthand for "Daily", "Weekdays", "Weekends").
- Overdue rows get a ruby border + faint red wash so they read as urgent at a glance.
- Recurring tasks created on a non-applicable DOW (e.g., a Mon/Wed/Fri task created on a Thursday) now surface in **Upcoming** instead of vanishing — sorted by their next occurrence date alongside one-off scheduled tasks.

### Changed
- Day rollover: completed *one-off* tasks are still swept (unchanged), but completed *recurring* tasks are no longer deleted — they're re-armed (`completed: false`) when the new day's day-of-week matches their pattern.

### Fixed
- TaskView "today" was being computed via `toISOString().split('T')[0]` (UTC), which mis-classified tasks across the local/UTC date boundary in the evening (e.g., a Friday-only recurring task showing on Thursday at 6:49 PM Mountain, since UTC was already Friday). Now uses local date components.
- Note: the same UTC-date pattern still exists in 5 other places (`store.jsx`, `db.js`, `HabitChecklist.jsx`, `MealTracker.jsx`, `LogExpense.jsx`) — same latent bug, untouched for now. Worth a focused sweep later.

## 2026-04-23 — Long-press to edit (drop pencil buttons)

### Added
- New `useLongPress` hook (`src/hooks/useLongPress.js`) — pointer-based, returns handlers for any row. 500ms threshold, 8px movement cancels (so vertical scrolling doesn't fire long-press), bails when the press starts on an inner button so delete / `+` controls keep their own click semantics. Triggers `navigator.vibrate(15)` for haptic feedback if supported.

### Changed
- Habit + Task rows enter edit mode via long-press instead of a pencil button. Short tap still toggles complete (and increments repeatables via the `+` button as before).
- Extracted `TaskRow`, `DailyHabitRow`, `RepeatableHabitRow` components so each row can attach its own long-press handlers cleanly.
- Added `user-select: none` and `-webkit-touch-callout: none` to row classes to suppress text selection + iOS callout menus during the press.

### Removed
- Pencil edit buttons on every row, plus their associated `.task-edit-btn` / `.habit-edit-btn` CSS — replaced by the long-press affordance.

## 2026-04-23 — Habit editing + emoji input + drop Category

### Added
- Inline edit on habit rows. Pencil button on every row (daily and repeatable) opens a stacked form: name, emoji input, type (Daily / Repeatable), difficulty, Save / Cancel / Delete. Enter saves, Escape cancels.
- Emoji input replaces the fixed 24-icon grid in HabitManager. Centered text input that pops the system emoji keyboard on tap; falls back to ✨ if left empty.

### Changed
- Daily-habit row wrapper changed from `<button>` to a `<div role="button">` so nested controls (pencil, edit form) are valid markup. Tap-to-toggle behavior unchanged.

### Removed
- Category field from the Habit add/edit form and the Manage Habits row label. Existing habits keep their `category` field on disk (harmless), but the UI no longer surfaces it. Category remains in use for expenses.

## 2026-04-23 — Task editing

### Added
- Inline edit on active task rows. Pencil button next to the trash opens the row into an edit form (full-width text input, difficulty picker, Save / Cancel). Enter saves, Escape cancels.
- `updateTask(id, updates)` store action.

### Notes
- Only active (uncompleted) tasks can be edited. Editing a completed task didn't have a meaningful use case; if needed later, the same pattern extends trivially.

## 2026-04-23 — Habit + Task difficulty tiers

### Added
- Difficulty tiers for habits and tasks: Easy (5 ✨), Medium (10 ✨), Hard (20 ✨). Same value at the same tier whether it's a habit or a task — symmetric earning economy.
- Difficulty picker (segmented Easy / Medium / Hard buttons with the tier's Stardust value beneath each label) in:
  - Add Task form
  - Add / Edit Habit form (HabitManager)
- New store exports: `DIFFICULTY_LEVELS`, `stardustForDifficulty(d)`.

### Changed
- `addHabit`, `addTask` now accept an optional `difficulty` argument (defaults to `'medium'`).
- `toggleHabit`, `completeTask`, `uncheckTask` award/refund based on the row's stored difficulty.
- HabitChecklist row, TaskView row meta, and the Manage Habits list reflect the row's difficulty value (e.g. a Hard daily habit shows `20 ✨` instead of the old flat `10`). Repeatable habits scale the per-tap value.
- Existing habit + task records (no `difficulty` field) read as Medium implicitly, so no migration runs and no values shift on day one.

## 2026-04-23 — Settings as overlay, tap-to-toggle tasks

### Added
- Tap-anywhere-on-row to toggle a task between completed and uncompleted (was: only the small checkbox was tappable).
- `uncheckTask` store action — refunds the 10 ✨ earned when a task gets unchecked, mirror of `completeTask`.

### Changed
- Settings is now a gear-toggle: tapping the gear in the top-right opens Settings; tapping it again closes back to the previous tab. The "← Back" button is gone.

## 2026-04-23 — Day rollover, task sweep, meal source tiers

### Added
- Configurable day-rollover hour. New "Day & Rollover" section in Settings with an hour-of-day picker (Midnight … 11:00 PM). Anything before the configured hour counts as the previous day.
- Auto-rollover: on app load and on tab focus, the app checks whether the configured hour has passed since `habitDay` was stamped, and rolls automatically — manual "New Day" button still works as a force-roll.
- Meal source Stardust now scales by source: home-cooked 25, groceries/prepped 18, dining out 12, delivery 8 (was: 25 for home-cooked, flat 15 for everything else). `stardustForMealSource()` helper exported from the store as the single source of truth.

### Changed
- Day rollover (manual or automatic) now also sweeps the completed-task pile. Replaces the manual "Clear" button.

### Removed
- "Clear" button from the Tasks completed section, and the underlying `clearCompletedTasks` store action — both replaced by the rollover sweep. (The old action also had a latent bug: its `where('completed').equals(1)` filter never matched the boolean `true` values stored on task rows, so it had been a no-op.)

## 2026-04-23 — Brackroot Tokens v0.4

### Added
- Design tokens v0.4 as the canonical variable layer in `src/App.css`: `--ink` / `--bg` / `--accent` scales, `--accent-glow` + `--accent-wash`, type scale (`--t-xs` → `--t-2xl`), spacing scale (`--s-1` → `--s-7`), `--r-sm`/`--r`/`--r-lg`/`--r-pill`, `--shadow-card`/`--shadow-glow`/`--shadow-modal`, and hero-only `--paper` / `--paper-hero` grains.
- Three-family type system wired in `index.html`: IM Fell English (display), Inter (body), Kalam (hand-written narration). Replaces Cormorant Garamond + Nunito.
- Legacy aliases (`--bg-deep`, `--text-cream`, `--accent-amber`, etc.) remap to the new tokens so existing component CSS still resolves while the repaint is incremental.

### Changed
- Header gradient → hairline divider. No gradient bands across surfaces ("texture is a spice, not a background"); gradients remain only on primary buttons and progress fills as spec'd.
- Stardust pill restyled to `--accent-wash` + 1px `--accent-glow` border + gold text, per the hi-fi spec.
- Nav tab bar shifted to `--bg-2` with `--accent-2` active color and an amber-glow drop-shadow on the active icon.
- Section titles use `--font-display` at `--t-lg` with a `--ink-5` hairline instead of a bold lantern color on a warm border.

### Notes
- Design source: Claude Design handoff bundle (`Brackroot Tokens.html`, `tokens.json` v0.4.0).

### Added — follow-ups
- Tend tab now has a Habits/Tasks segmented sub-nav (same pattern as Campus's Map/Events/Challenges). Subnav CSS generalized to `.subnav`/`.subnav-btn`; `.campus-subnav` classes kept as aliases.

### Fixed — follow-ups
- Event-details modal Replay/Close buttons are now the same height and stack with a 10px gap (was: Replay full-size amber, Close cramped against it with a smaller font).

## 2026-04-19

### Added
- Heart events now render as a visual-novel-style scene: background image + character portrait layered behind a dialog box that takes up the bottom third of the screen, with a speaker tab carrying the character's name, portrait icon, and level.
- Asset pipeline at `public/art/` — drop WebP files to populate scenes:
  - `public/art/characters/<id>.webp` — one portrait per character
  - `public/art/backgrounds/<key>.webp` — keyed backgrounds, referenced by individual heart events
- Heart event data can be a plain string (text only) or an object `{ text, background }` to associate a background key. Existing entries stay strings; upgrade per-scene when art lands.
- Graceful fallbacks throughout: missing character art → circular emoji badge; missing background → cozy gradient; missing text → visible `[to be written]` placeholder.

### Changed
- Richard's default location is now The Gardens (was The Atrium).
- Tasks no longer carry a category. The Add Task form is now just a text input; existing task records keep their orphaned category field but it's ignored.

### Fixed
- Expense Stardust reverted to a flat 10, regardless of amount. Tying earning to the dollar value broke the relationship economy — a single $500 expense could nearly level a character. Logging remains unchanged; only the Stardust math.

## 2026-04-18 — Theme Overhaul Phase 2: characters, interactions, heart events

### Added
- Seven-character roster seeded on first boot: Marlow, Brendan, Diana, Peter, Richard, Sophia, and The Wind
- Campus tab with three sub-pages: Map, Events, Challenges
- Map displays unlocked characters' locations (The Courtyard, Kitchens, SGC Office, Library, Dueling Grounds, Atrium) — each card leads with the location name; occupant, title, and level are secondary
- Interaction modal with three tiers: Chat (25 ✨, +5 RP, Lv 1+), Hang Out (100 ✨, +15 RP, Lv 4+), Bond (300 ✨, +40 RP, Lv 7+)
- One interaction per character per calendar day (daily limit)
- Randomized line pools per character per (level-bracket × tier); placeholder `[to be written]` strings shown where content is pending
- Relationship level progression with RP thresholds (30, 40, 60, 80, 120, 160, 220, 300, 400 for levels 1→10)
- Full-screen visual-novel-style heart event overlay with character portrait, level tag, title, and multi-paragraph narrative
- Heart events fire automatically on level-up and on character-unlock (the unlock event IS the Level 1 heart event)
- Journal tab archives unlocked characters with title, level, progress bar, recent interactions, and replayable heart events
- Narrative Events page with five character-unlock events (Wander Divines at Night, Raid the Kitchen, Plan the Autumn Masquerade, Launch the Dueling Reform Project, Establish SGC-Ledger Liaison) and gate logic (Stardust cost + character-level / event / challenge prerequisites)
- Challenges page placeholder (Phase 4)
- Marlow content: full Level 1–7 heart events from Ellene's drafts, Chat (Lv 1–3 and Lv 4–6) and Hang Out (Lv 4–6) line pools
- Other five characters: stubbed line pools and heart events, filled when Ellene writes them

### Changed
- Dexie schema v7 adds `characters`, `interactions`, `events`, `challenges`, and `heartEvents` tables
- `importAllData` re-seeds characters and reconciles purchased unlock events after legacy imports that predate the character system

### Fixed
- Characters table left empty after signing in with pre-character-system cloud data, silently breaking event purchases (heart event fired but Marlow never flipped to unlocked)

## 2026-04-18 — Theme Overhaul Phase 1: unified Stardust

### Added
- Stardust ✨ as the single unified currency, replacing per-category Silver pools
- Tend tab composing Habits and Tasks into one surface
- Settings gear in the header hosting Export/Import/Reset, Cloud Sync, and Category Manager
- Dexie schema v6 adds empty `characters`, `interactions`, `events`, and `challenges` tables awaiting Phase 2

### Changed
- Navigation reduced from 6 tabs to 5: Campus, Journal, Spend, Eat, Tend (Campus and Journal land as placeholders in this phase)
- `silver` → `stardust`, `silverEarned` → `stardustEarned`, `buildingTree` → `category` across the codebase
- Expense Stardust is now a flat `10 + floor(amount)`; no budget multiplier
- Import path migrates pre-v6 data by preserving logs (expenses, meals, habits, tasks) while resetting currency to 0

### Removed
- 48-building campus system (`CampusView`, `BuildingModal`, building lore in categories)
- Budget module (`BudgetView`, `setBudget`, 2× Silver multiplier, Term Honours banner)
- Per-category Silver pools and building unlock mechanics

## 2026-03-25

### Added
- Firebase cloud sync — sign in with Google to sync data across devices
- Cloud Sync section in the Budgets tab with sign in/out and Sync Now
- Uses same Firebase project as Melody's Medicines
- Offline support via Firestore persistence
- Debounced cloud writes (2s) after every data mutation

### Changed
- Moved to its own repo (previously part of Melody's Medicines repo)
- Import now pushes to Firestore before reloading

## 2026-03-20

### Added
- Monthly and weekly budgets per spending category
- Category manager: add, edit, reorder, and delete custom categories
- Budget progress bars on the Campus and Spend views

## Initial Release

### Features
- Dark academia campus theme with 11 spending categories and 4-tier buildings
- Silver currency earned from logging expenses, habits, and meals
- Expense tracking with category assignment and daily/weekly/monthly ledger
- Habit checklist with daily (checkbox) and repeatable (counter) types
- Habit streaks and Full Day bonus (20 silver when all three areas have activity)
- Meal tracker with source types (home cooked, prepped, delivery, dining out)
- Weekly meal streak bonus (50 silver for 7 consecutive days)
- Campus view showing building unlock progress per category
- Budget-aware silver: 2x silver when spending is under budget
- Import/export save data as JSON
- PWA support (installable, works offline)
- IndexedDB storage via Dexie with schema migrations
