# ⚔️ DailyQuest

A gamified daily routine tracker. Your daily tasks become quests — tick them off, earn XP, level up, keep your streak alive, and review your progress with reports, badges, heatmap, and charts. 100% offline: all data lives in your browser's `localStorage`.

## Features

**Quests (MVP)**
- Default daily quests: Coding, Bathing, Gym, Study
- Add / edit / delete quests (name, emoji icon, XP value)
- Animated checkbox completion with floating "+XP"
- Quests reset automatically at midnight (or on first load of a new day)
- Top bar with total XP, level, and progress bar to the next level

**End-of-Day Report**
- Completed vs missed quests, completion %, XP earned
- Letter grade S → D (by completion %) with a motivational message
- Current streak (consecutive days with ≥ 80% completion)
- Missed-quest list; every finished day is saved to history

**Game features**
- +50 bonus XP for a perfect day (all quests done)
- Levels get progressively harder (power-curve XP requirements)
- 10 achievements (First Step, Perfect Day, On Fire, 7-Day Streak, Gym Rat, Night Owl, Early Bird, Scholar, Rising Star, Perfectionist) with toast notifications and +25 XP each
- Confetti celebration on a perfect day (once per day, respects reduced motion)

**History & analytics**
- GitHub-style calendar heatmap colored by completion %
- 30-day, weekly, and monthly trends (Recharts) for completion % and XP
- Lifetime stats: best streak, days logged, perfect days
- Per-task consistency bars, most consistent / most skipped highlights

**Polish**
- Desktop phone-frame preview: on wide screens (≥ 768px) the app renders inside a CSS-only iPhone-style mockup (status bar, dynamic island, home indicator) — set `SHOW_PHONE_FRAME = false` in `src/constants.js` to disable; real phones / narrow windows get the full-screen app
- Dark mode toggle (persisted)
- Mobile-first responsive, game-like UI
- Optional daily browser-notification reminder at a time you choose
- Export / import all data as JSON backup
- Reset progress from Settings

## Setup

Requires Node.js 18+ ([download](https://nodejs.org)).

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

> This repo includes a portable Node.js runtime in `.node/` (Windows x64, git-ignored). To use it instead of a system install:
> ```bash
> export PATH="$PWD/.node:$PATH"   # Git Bash on Windows
> npm install && npm run dev
> ```

## Scripts

| Command           | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server (hot reload)  |
| `npm run build`   | Production build into `dist/`      |
| `npm run preview` | Serve the production build locally |

## Tech stack

- [React 18](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [Recharts](https://recharts.org) for analytics charts
- No backend — data persists in `localStorage` under the key `dailyquest:v1`

## Project structure

```
src/
├── App.jsx                  # App shell: tabs, modals, confetti, reminder
├── main.jsx                 # Entry point
├── index.css                # Tailwind v4 + component classes + animations
├── constants.js             # Default quests, bonus XP, thresholds, emojis
├── storage.js               # localStorage load/save + backup import/export
├── context/
│   └── QuestContext.jsx     # Game state: reducer, actions, day rollover
├── components/
│   ├── TopBar.jsx           # XP / level / progress bar
│   ├── TaskList.jsx         # Quest list + add modal
│   ├── TaskItem.jsx         # Quest row (checkbox, edit, delete)
│   ├── TaskForm.jsx         # Shared add/edit form
│   ├── ReportModal.jsx      # End-of-Day Report
│   ├── BadgesStrip.jsx      # Achievements grid
│   ├── BadgeToasts.jsx      # Achievement toasts
│   ├── BadgeWatcher.jsx     # Awards newly earned badges
│   ├── ProgressView.jsx     # Analytics page
│   ├── Heatmap.jsx          # Calendar heatmap
│   ├── SettingsModal.jsx    # Theme, reminder, backup, reset
│   ├── charts/
│   │   └── Trends.jsx       # Recharts daily/weekly/monthly views
│   └── ui/
│       ├── Modal.jsx        # Accessible modal shell
│       └── Confetti.jsx     # Perfect-day confetti
├── hooks/
│   └── useReminder.js       # Daily notification reminder
└── utils/
    ├── date.js              # Local YYYY-MM-DD helpers
    ├── xp.js                # Level curve math
    ├── grades.js            # S–D grades + messages
    ├── stats.js             # Streak calculations
    ├── badges.js            # Achievement definitions + evaluation
    └── analytics.js         # Day map, chart series, task stats
```

## Notes

- **Where's my data?** Everything is stored per-browser in `localStorage`. Clearing site data removes progress — use **Settings → Export JSON** for backups.
- **Streak rule:** a day counts when completion is ≥ 80%. Today counts once you've finished (or preview) the day at ≥ 80%.
- **Grades:** S = 100%, A ≥ 80%, B ≥ 60%, C ≥ 40%, D below.
