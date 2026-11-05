import {
  DATA_VERSION,
  DEFAULT_TASKS,
  FOCUS_LIMITS,
  FOCUS_MODES,
  REPEAT_MODES,
  STORAGE_KEY,
  TARGET_MAX,
  TARGET_MIN,
  TASK_TYPES,
  TIME_OF_DAY,
  UNIT_MAX_LEN,
  XP_MAX,
  XP_MIN,
} from './constants'
import { apiFetch, getAuthRecord, isOnlineSession } from './api/client'

/**
 * Data layer: localStorage stays the immediate cache (every existing call
 * keeps its exact name, sync behavior and return shape), while reads/writes
 * are mirrored to the backend API:
 *
 *  - loadState()  → returns the cache instantly, then refreshes from the
 *                   server in the background (dispatches
 *                   'dailyquest:server-state' when newer data lands)
 *  - saveState()  → writes the cache instantly, then flushes to the
 *                   server (debounced); failures queue in
 *                   'dailyquest:pending' and sync when back online
 *  - migrateAndSync() → one-time silent upload of pre-upgrade localStorage
 *                   data on first login, then the initial pull
 *
 * Guests (no token) never touch the API — they stay local-only.
 */

const PENDING_KEY = 'dailyquest:pending'
const migratedKey = (auth) => `dailyquest:migrated:${auth?.userId || auth?.token || 'anon'}`

/** Debounce for server flushes (state saves fire on every reducer change). */
const FLUSH_DELAY = 700

let lastSyncedJson = null // dedupe: skip PUT when nothing changed
let latestState = null
let flushTimer = null
let refreshInFlight = false
let syncReady = false // online listeners installed

function canSync() {
  return typeof window !== 'undefined' && isOnlineSession()
}

/* ===== original local cache behavior (unchanged contract) ===== */

export function loadState() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    const state = raw ? migrateState(JSON.parse(raw)) : null
    // Background refresh + pending-write flush; the return value is untouched.
    if (canSync()) {
      initSyncListeners()
      migrateAndSync().catch(() => {})
    }
    return state
  } catch (err) {
    console.error('DailyQuest: failed to load state', err)
    return null
  }
}

export function saveState(state) {
  try {
    if (typeof window === 'undefined') return
    const json = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, json)
    if (!canSync()) return
    if (json === lastSyncedJson) return // already what the server has
    latestState = state
    scheduleFlush()
  } catch (err) {
    console.error('DailyQuest: failed to save state', err)
  }
}

/* ===== server sync ===== */

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush(latestState)
  }, FLUSH_DELAY)
}

/** Push the given state to the server; queue it locally if unreachable. */
async function flush(state) {
  if (!state || !canSync()) return
  try {
    const saved = await apiFetch('/state', { method: 'PUT', body: { state } })
    lastSyncedJson = JSON.stringify(saved ?? state)
    clearPending()
  } catch (err) {
    if (err.code === 'NETWORK' || err.status >= 500) {
      queueWrite(state) // offline → sync later
    } else if (err.status === 401) {
      // Expired/invalid token: keep the cache; the user re-logs-in later.
      console.warn('DailyQuest: session rejected by server, sync paused', err.message)
    } else {
      console.warn('DailyQuest: server sync failed', err.message)
    }
  }
}

/** Store an unsent snapshot (latest wins — full-state sync is LWW). */
function queueWrite(state) {
  try {
    const auth = getAuthRecord()
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ userId: auth?.userId || null, state, queuedAt: Date.now() }),
    )
  } catch {
    /* ignore */
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

/** Read the queued offline snapshot (or null), dropping cross-account data. */
function readPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw)
    const auth = getAuthRecord()
    if (!entry?.state || entry.userId !== (auth?.userId || null)) {
      clearPending() // different account (or guest) — never cross-post data
      return null
    }
    return entry
  } catch {
    clearPending()
    return null
  }
}

/** Retry a write made while offline (debounced fire-and-forget). */
function flushPending() {
  const entry = readPending()
  if (!entry) return
  latestState = entry.state
  scheduleFlush()
}

/** Pull the server state, cache it, notify the app (if it changed). */
async function refreshFromServer() {
  if (!canSync() || refreshInFlight) return
  refreshInFlight = true
  try {
    const serverState = await apiFetch('/state')
    const json = JSON.stringify(serverState)
    if (json === lastSyncedJson) return
    lastSyncedJson = json
    localStorage.setItem(STORAGE_KEY, json)
    emitServerState(serverState)
  } catch (err) {
    // Offline / transient: silent — the cache keeps the app working.
    if (err.code !== 'NETWORK' && err.status !== 401) {
      console.warn('DailyQuest: background refresh failed', err.message)
    }
  } finally {
    refreshInFlight = false
  }
}

function emitServerState(state) {
  try {
    window.dispatchEvent(new CustomEvent('dailyquest:server-state', { detail: state }))
  } catch {
    /* ignore */
  }
}

function initSyncListeners() {
  if (syncReady) return
  syncReady = true
  window.addEventListener('online', () => {
    flushPending()
    refreshFromServer()
  })
}

/**
 * Called on login (and on load when a session exists): silently uploads any
 * pre-upgrade localStorage data exactly once, then pulls the server state.
 */
export async function migrateAndSync() {
  if (!canSync()) return { migrated: false, synced: false }
  initSyncListeners()
  const auth = getAuthRecord()
  const marker = migratedKey(auth)

  try {
    if (!localStorage.getItem(marker)) {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const local = migrateState(JSON.parse(raw))
        const res = await apiFetch('/state/migrate', { method: 'POST', body: { state: local } })
        if (res?.state) lastSyncedJson = JSON.stringify(res.state)
      }
      localStorage.setItem(marker, '1')
    }
  } catch (err) {
    // Never mark migrated on failure — silently retry next time.
    if (err.code === 'NETWORK') return { migrated: false, synced: false }
    console.warn('DailyQuest: migration skipped', err.message)
    localStorage.setItem(marker, '1') // server refused — don't loop forever
    await refreshFromServer()
    return { migrated: false, synced: true }
  }

  // Flush writes queued while offline BEFORE pulling, so an older server
  // snapshot can never clobber newer local work.
  const queued = readPending()
  if (queued) await flush(queued.state)

  await refreshFromServer()
  return { migrated: true, synced: true }
}

/* ===== original helpers below (unchanged) ===== */

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value))
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Normalize an array of task-like objects into valid tasks (any source). */
export function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) throw new Error('"tasks" must be an array')
  return tasks.map((t, i) => {
    const type = TASK_TYPES.includes(t?.type) ? t.type : 'yesno'
    const target =
      type === 'yesno' ? undefined : clampInt(t?.target, TARGET_MIN, TARGET_MAX, 1)
    const days = Array.isArray(t?.days)
      ? [...new Set(t.days.map((d) => Math.round(Number(d))).filter((d) => d >= 0 && d <= 6))]
    : undefined
    return {
      id:
        typeof t?.id === 'string' && t.id
          ? t.id
          : `imported-${Date.now()}-${i}`,
      name: String(t?.name ?? '').trim() || `Quest ${i + 1}`,
      emoji: String(t?.emoji ?? '✨').slice(0, 4),
      xp: clampInt(t?.xp, XP_MIN, XP_MAX, 10),
      type,
      // Count/timed targets; undefined for yesno keeps old saves intact.
      target,
      unit: type === 'count' ? String(t?.unit ?? 'times').slice(0, UNIT_MAX_LEN) : undefined,
      progress: type === 'count' ? Math.max(0, Math.round(t?.progress || 0)) : undefined,
      minutes: type === 'timed' ? Math.max(0, Math.round(t?.minutes || 0)) : undefined,
      timer: type === 'timed' && t?.timer ? String(t.timer) : null,
      // Schedule: old tasks without a repeat rule were daily Yes/No quests.
      repeat: REPEAT_MODES.includes(t?.repeat) ? t.repeat : 'daily',
      days,
      onceDate: /^\d{4}-\d{2}-\d{2}$/.test(t?.onceDate || '') ? t.onceDate : undefined,
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(t?.startDate || '') ? t.startDate : undefined,
      timeOfDay: TIME_OF_DAY.includes(t?.timeOfDay) ? t.timeOfDay : 'any',
      done: Boolean(t?.done),
    }
  })
}

/**
 * Bring a loaded/legacy state up to DATA_VERSION. Idempotent — running it
 * twice changes nothing. v2: task types + repeat rules; v3: focus sessions.
 */
export function migrateState(state) {
  if (!state || typeof state !== 'object') return state
  if (state.version < 2) {
    state = {
      ...state,
      version: 2,
      tasks: normalizeTasks(state.tasks || []),
      // History entries already snapshot per-task results; normalize them so
      // type/target/unit/result fields exist (old snapshots become yesno).
      history: (Array.isArray(state.history) ? state.history : []).map((h) => ({
        ...h,
        tasks: normalizeTasks(h.tasks || []).map(({ id, name, emoji, xp, type, target, unit, progress, minutes, done }) => ({
          id, name, emoji, xp, type, target, unit, progress, minutes, done,
        })),
      })),
    }
  }
  if (state.version < 3) {
    state = {
      ...state,
      version: 3,
      // Session records: [{id, taskId, taskName, date, startedAt (ISO),
      // minutes, completed, mode, pauses}]. Old saves simply get none.
      focusSessions: Array.isArray(state.focusSessions)
        ? state.focusSessions.filter((f) => f && typeof f.date === 'string' && typeof f.minutes === 'number')
        : [],
      // A mid-session save survives migration untouched (validated in the
      // reducer's focus actions); a legacy state just has no active session.
      focus: state.focus && typeof state.focus === 'object' ? state.focus : null,
    }
  }
  return state
}

/**
 * Parse and validate an imported backup file, returning a state-shaped object.
 * Throws with a friendly message when the file is not a DailyQuest backup.
 */
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Not a DailyQuest backup file.')
  }
  if (data.tasks !== undefined && !Array.isArray(data.tasks)) {
    throw new Error('"tasks" in the backup is invalid.')
  }
  if (data.history !== undefined && !Array.isArray(data.history)) {
    throw new Error('"history" in the backup is invalid.')
  }
  return {
    version: 3,
    tasks: data.tasks ? normalizeTasks(data.tasks) : [],
    totalXp: clampInt(data.totalXp, 0, Number.MAX_SAFE_INTEGER, 0),
    history: data.history
      ? data.history.filter(
          (h) => h && typeof h.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(h.date),
        )
      : [],
    focusSessions: Array.isArray(data.focusSessions)
      ? data.focusSessions.filter((f) => f && typeof f.date === 'string' && typeof f.minutes === 'number')
      : [],
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
    lastActiveDate:
      typeof data.lastActiveDate === 'string' ? data.lastActiveDate : undefined,
  }
}

/** Download the current state as a JSON backup file. */
export function downloadBackup(state) {
  const payload = {
    app: 'DailyQuest',
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    totalXp: state.totalXp,
    history: state.history,
    focusSessions: state.focusSessions,
    settings: state.settings,
    lastActiveDate: state.lastActiveDate,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dailyquest-backup-${state.lastActiveDate || 'export'}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
