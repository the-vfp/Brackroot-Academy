# Changelog

All notable changes to Brackroot Academy are documented here.

## 2026-04-19

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
