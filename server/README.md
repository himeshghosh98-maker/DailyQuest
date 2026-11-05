# DailyQuest API Server

Structured Node.js + Express backend for DailyQuest: real auth (bcrypt + JWT),
task/progress/focus/report APIs that mirror the app's existing data model
byte-for-byte, server-side XP/level/streak/badge math, and Gemini-powered AI
insights (key stays server-side, responses cached for hours).

## Requirements

- Node.js 18+ (20+ recommended)
- MongoDB — any one of:
  - **nothing** (dev): if `MONGODB_URI` is empty the server auto-provisions a
    local on-disk MongoDB in `server/.mongo-data/` (via `mongodb-memory-server`),
    so the app runs with zero setup and data survives restarts
  - **local MongoDB**: `mongodb://127.0.0.1:27017/dailyquest`
  - **free Atlas cluster**: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/dailyquest?retryWrites=true&w=majority`

## Setup

```bash
cd server
npm install
cp .env.example .env      # then edit the values
```

### `.env`

| Variable          | Needed for                                | Example                                                        |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `PORT`            | API port (default 4000)                   | `4000`                                                         |
| `CORS_ORIGIN`     | allowed frontend origins (dev allows any `localhost` port) | `http://localhost:3000,http://localhost:5173`   |
| `MONGODB_URI`     | database (empty = local dev MongoDB)      | `mongodb+srv://user:pass@cluster0.x.mongodb.net/dailyquest`    |
| `JWT_SECRET`      | signing tokens (**required in production**)| `openssl rand -hex 32`                                         |
| `JWT_EXPIRES_IN`  | token lifetime                            | `30d`                                                          |
| `GEMINI_API_KEY`  | AI endpoints (optional — see below)       | `AIza…`                                                        |
| `GEMINI_MODEL`    | Gemini Flash model id                     | `gemini-3.6-flash`                                             |
| `AI_CACHE_HOURS`  | AI response cache TTL                     | `4`                                                            |

> `.env` is git-ignored — never commit real secrets. `.env.example` is checked in.

### Gemini API key (AI features)

The AI endpoints work without a key using deterministic rule-based fallbacks.
To get real Gemini analysis, grab a **free** key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey), set
`GEMINI_API_KEY` in `server/.env` and restart. The key is only ever read
server-side — it is never sent to the frontend. Failures, timeouts (30s), and
rate limits automatically fall back to the rule-based responses. Note the free
tier allows a limited number of requests **per model per day** (recent Flash
models ≈ 20); `AI_CACHE_HOURS` caching keeps usage well inside that, and
`GEMINI_MODEL` can point at any Flash model with remaining quota.

## Run

```bash
cd server
npm run dev      # auto-restarts on changes (node --watch)
# or
npm start        # plain node
```

From the repo root you can run frontend + backend together:

```bash
npm run dev:all        # Next.js (:3000) + API (:4000)
npm run dev:all:vite   # Vite (:5173) + API (:4000)
```

The frontend reads its API base URL from the repo-root `.env`
(`VITE_API_URL` / `NEXT_PUBLIC_API_URL`, default `http://localhost:4000/api/v1`).

## Tests

```bash
cd server
npm test            # unit tests: XP curve, grades, streaks, schedule, focus XP
node scripts/smoke.mjs   # end-to-end API checks (server must be running)
```

## API overview (all under `/api/v1`)

| Area     | Endpoint | Notes |
| -------- | -------- | ----- |
| auth     | `POST /auth/signup` · `POST /auth/login` · `GET /auth/me` | bcrypt hashes, JWT bearer tokens; login returns `USER_NOT_FOUND` so the client can auto-signup on first use |
| state    | `GET /state` · `PUT /state` · `POST /state/migrate` | exact frontend state blob; migrate uploads pre-upgrade localStorage once |
| tasks    | `GET/POST /tasks` · `PUT/DELETE /tasks/:id` | repeat rules, Yes/No · Count · Timed types |
| progress | `POST /progress/:id/complete` · `POST /progress/:id/toggle` · `PUT /progress/:id/count` · `PUT /progress/:id/minutes` · `POST /progress/:id/timer` | same XP add/remove rules as the frontend reducer |
| focus    | `POST /focus/start` · `POST /focus/stop` · `GET /focus/sessions` | session XP, completion bonus, anti-farm minimums |
| reports  | `GET /reports/daily` · `GET /reports/weekly` · `POST /reports/finish-day` | completion %, grade, XP, streak, missed tasks, focus time |
| stats    | `GET /stats` | level curve, streaks, badge catalog in the shapes the UI expects |
| ai       | `POST /ai/insights` · `GET /ai/weekly-summary` · `POST /ai/suggest-tasks` | Gemini or rule fallbacks, cached `AI_CACHE_HOURS` |

All routes except `/auth/*` and `/health` require `Authorization: Bearer <token>`.

Errors always return `{ message, code, details? }` through the centralized
error middleware; request bodies are validated with zod schemas.
