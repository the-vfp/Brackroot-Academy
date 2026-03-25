# Changelog

All notable changes to Brackroot Academy are documented here.

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
