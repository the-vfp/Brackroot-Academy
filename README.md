# Brackroot Academy

A cozy life tracker with a dark academia relationship layer.

> 🏰 [**Live app**](https://the-vfp.github.io/Brackroot-Academy/) — installable as a PWA on mobile via "Add to Home Screen."

Log your real life — expenses, meals, habits, tasks — and earn **Stardust ✨**. Spend it on conversations, hang-outs, and bonds with the characters at the fictional Brackroot Academy. The reward for paying attention to your life is getting to spend time with the people you love.

---

## The Core Loop

**Log your life → earn Stardust → spend it on people → watch the relationship deepen.**

1. Log expenses, meals, habits, and tasks across the day.
2. Earn Stardust from each entry, plus bonuses for showing up consistently.
3. Spend Stardust on character interactions or narrative events.
4. Each interaction adds Relationship Points. Cross a threshold and the character levels up, firing a scripted visual-novel-style heart event.
5. Repeat — tracking keeps Stardust flowing; the relationships keep tracking meaningful.

---

## What's Inside

- **Stardust economy**: one unified currency, no per-category accounting. Flat earning rates that don't punish big spends or reward tight budgets — the goal is noticing your life, not optimizing it.
- **Five-tab navigation**: Campus (relationship hub), Journal (unlocked characters + progress + heart event replays), Spend (expenses + Ledger), Eat (meals + history), Tend (habits + one-time tasks).
- **Six playable characters** plus The Wind. Each unlocks through a narrative event with gated prerequisites. Each has 10 relationship levels, three interaction tiers (Chat / Hang Out / Bond), and a scripted heart event per level.
- **Visual-novel heart events**: full-screen scenes with a background image, character portrait, and dialog box. Art drops into `public/art/` and scenes fill in incrementally; graceful fallbacks (gradient + emoji) mean the system works from day one.
- **Offline-first PWA**: all data stored locally via IndexedDB (Dexie). Optional Firebase cloud sync for cross-device.
- **Export / import JSON** from the Settings sheet; data belongs to you.

### The Roster

| Character | Arc | Location | Activity |
|---|---|---|---|
| Marlow Quillan | Romance | The Courtyard | Journal |
| Sophia Barnes | Kinship | The Kitchens | Cook a meal |
| Brendan Selma | Partnership | The SGC Office | Tidy up |
| Peter Adair | Warmth | The Dueling Grounds | Walk |
| Richard Devereaux | Perception | The Gardens | Creative writing |
| Diana Delawarr | Mentor | The Library | Read |
| The Wind | — | Everywhere | (separate progression, TBD) |

---

## Design Philosophy

1. **Reward tracking, not optimization.** Stardust is earned by logging, not by spending less or eating better. No judgment on what you log.
2. **No guilt mechanics.** Missing a day doesn't punish you. The app doesn't decay. The worst outcome is a missed bonus.
3. **Cozy journal, not productivity app.** Opening it should feel like a well-loved notebook.
4. **The reward is connection.** Tracking your life generates the warmth; spending it on people is the payoff.

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI framework | [React 19](https://react.dev/) |
| Build | [Vite 6](https://vitejs.dev/) |
| Local storage | [Dexie 4](https://dexie.org/) (IndexedDB) |
| Cloud sync | [Firebase Firestore](https://firebase.google.com/) (Google auth) |
| PWA / offline | [Workbox](https://developer.chrome.com/docs/workbox) via [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Styling | Plain CSS (custom properties, no framework) |
| Hosting | [GitHub Pages](https://pages.github.com/), auto-deployed via Actions on push to `main` |

Fonts: Cormorant Garamond (display), Nunito (body). Palette: dark academia — burgundy, bronze, gold on deep brown.

---

## Getting Started

### Run locally

```bash
git clone https://github.com/the-vfp/Brackroot-Academy.git
cd Brackroot-Academy
npm install
npm run dev
```

Vite defaults to `http://localhost:5173/Brackroot-Academy/` (note the base path).

### Build for production

```bash
npm run build
```

Output lands in `dist/`. The GitHub Actions workflow at `.github/workflows/deploy.yml` runs this on every push to `main` and deploys to Pages automatically.

### Firebase (optional)

Cloud sync is gated behind signing in with Google. The Firebase config lives in `src/firebase.js` and points at a shared project. If you fork this repo and want your own sync, swap the config with your own Firebase project's. Local-only usage requires no Firebase setup — the app works fully offline without ever signing in.

---

## Project Structure

```
src/
  App.jsx              # shell: header, navigation, settings gear
  store.jsx            # global state, earning rules, purchase ops
  db.js                # Dexie schema + migrations + import/export
  data/
    characters.js      # character roster: titles, locations, activities
    interactions.js    # Chat/Hang Out/Bond tier config
    events.js          # narrative unlock events + gate logic
    lines/             # randomized line pools per character (9 pools each)
    heartEvents/       # scripted level-up scenes per character
  components/
    Campus/            # Map, Events, Challenges, InteractionModal, EventModal
    HeartEventOverlay.jsx  # visual-novel scene renderer
    Journal.jsx        # unlocked characters + progress + heart event replay
    Tend...            # habit checklist + task list
    ...
public/
  art/
    characters/        # <id>.webp per character — one portrait each
    backgrounds/       # <key>.webp scene backgrounds (reusable across scenes)
```

---

## Content Authoring

The app is data-driven. Write content without touching component code.

| Adding… | Where |
|---|---|
| A Chat / Hang Out / Bond line | `src/data/lines/{character}.js` — append a string to the appropriate pool array |
| A heart event | `src/data/heartEvents/{character}.js` — replace `null` at the right level with a string, or with `{ text, background: 'key' }` to attach a background |
| A character portrait | `public/art/characters/{id}.webp` |
| A scene background | `public/art/backgrounds/{key}.webp` — freely reusable across scenes |
| An event's flavor (non-unlock events) | `src/data/events.js` — set `flavor` field |

Multi-paragraph content uses template literals with blank lines as paragraph breaks. `*italic*` renders as emphasis in the overlay. See [`public/art/README.md`](public/art/README.md) for asset sizing and compression guidance.

Missing content degrades gracefully:

- Missing heart event → visible `[Character — Lv N heart event — to be written]` placeholder
- Missing character portrait → circular emoji badge
- Missing background → cozy autumn gradient
- Missing line pool → `[Character — Tier (bracket, Lv N) — line pool to be written]` stub

---

## Status

**Shipped:**
- Unified Stardust currency with all earning paths + bonuses
- Five-tab navigation + Settings sheet
- Full expense / meal / habit / task logging
- Seven-character roster seeded into the local DB
- Campus Map, Events, and (placeholder) Challenges sub-pages
- Chat / Hang Out / Bond interactions with level gating, daily limit, RP accumulation
- VN-style heart event scenes with graceful fallbacks
- Journal with per-character progress, title, and replayable heart events
- All five character-unlock events wired, with gate logic
- Firebase cloud sync with self-healing for pre-overhaul data
- Marlow's Lv 1–7 heart events, Chat Lv 1–3 / Lv 4–6, and Hang Out Lv 4–6 line pools

**In progress / pending:**
- Remaining character content (Marlow Lv 8–10, other five characters)
- Character portraits and scene backgrounds (pipeline exists)
- Tap-to-advance for heart events (Tears-of-Themis style), gated on restructuring drafts into chunks
- Phase 3: more narrative events (milestones, The Wind's system)
- Phase 4: Challenge system (calendar + character challenges)
- Phase 5: Level 10 capstone rewards

See [`CHANGELOG.md`](CHANGELOG.md) for the full history.

---

## Author

Built by [Ellene](https://github.com/the-vfp) with [Claude Code](https://claude.com/claude-code) as a pair-programming collaborator. Personal project — no contribution process or license at this time; feel free to fork and adapt for your own tracker.
