import ApiError from '../utils/ApiError.js'
import { DATA_VERSION } from '../config/constants.js'
import { normalizeTasks } from '../utils/tasks.js'
import State from '../models/State.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Fresh empty state — mirrors the frontend's freshState() (minus toasts). */
export function defaultState() {
  return {
    version: DATA_VERSION,
    tasks: [],
    totalXp: 0,
    history: [],
    focusSessions: [],
    focus: null,
    badges: {},
    settings: {},
    lastActiveDate: '',
    toasts: [],
  }
}

/** Server doc → the exact JSON shape the frontend's loadState() expects. */
export function toClientShape(doc) {
  if (!doc) return defaultState()
  return {
    version: Number(doc.version) || DATA_VERSION,
    tasks: Array.isArray(doc.tasks) ? doc.tasks : [],
    totalXp: Math.max(0, Number(doc.totalXp) || 0),
    history: Array.isArray(doc.history) ? doc.history : [],
    focusSessions: Array.isArray(doc.focusSessions) ? doc.focusSessions : [],
    focus: doc.focus && typeof doc.focus === 'object' ? doc.focus : null,
    badges: doc.badges && typeof doc.badges === 'object' ? doc.badges : {},
    settings: doc.settings && typeof doc.settings === 'object' ? doc.settings : {},
    lastActiveDate: typeof doc.lastActiveDate === 'string' ? doc.lastActiveDate : '',
    toasts: [],
  }
}

/**
 * Validate an incoming client state (PUT /state, migration). Anything
 * malformed falls back to safe defaults; never throws on shape issues.
 */
export function sanitizeIncoming(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw ApiError.badRequest('State must be an object.')
  }
  const fallback = defaultState()
  return {
    version: Number(state.version) || DATA_VERSION,
    tasks: normalizeTasks(Array.isArray(state.tasks) ? state.tasks : []),
    totalXp: Math.max(0, Math.round(Number(state.totalXp) || 0)),
    history: (Array.isArray(state.history) ? state.history : []).filter(
      (h) => h && typeof h === 'object' && typeof h.date === 'string' && DATE_RE.test(h.date),
    ),
    focusSessions: (Array.isArray(state.focusSessions) ? state.focusSessions : []).filter(
      (f) => f && typeof f.date === 'string' && typeof f.minutes === 'number',
    ),
    focus: state.focus && typeof state.focus === 'object' ? state.focus : null,
    badges: state.badges && typeof state.badges === 'object' && !Array.isArray(state.badges)
      ? state.badges
      : fallback.badges,
    settings:
      state.settings && typeof state.settings === 'object' && !Array.isArray(state.settings)
        ? state.settings
        : fallback.settings,
    lastActiveDate:
      typeof state.lastActiveDate === 'string' && DATE_RE.test(state.lastActiveDate)
        ? state.lastActiveDate
        : '',
  }
}

/** Fetch (creating on first use) the user's state document. */
export async function getStateDoc(userId) {
  let doc = await State.findOne({ user: userId })
  if (!doc) doc = await State.create({ user: userId, ...defaultState() })
  return doc
}

/** The client-shaped state for a user. */
export async function getState(userId) {
  return toClientShape(await getStateDoc(userId))
}

/** Replace the whole state blob (offline sync / migration). */
export async function replaceState(userId, incoming) {
  const clean = sanitizeIncoming(incoming)
  const doc = await getStateDoc(userId)
  doc.set(clean)
  await doc.save()
  return toClientShape(doc)
}

/** Persist a mutated doc (services mutate doc fields, then call this). */
export async function saveStateDoc(doc) {
  doc.markModified('tasks')
  doc.markModified('history')
  doc.markModified('focusSessions')
  doc.markModified('focus')
  doc.markModified('badges')
  doc.markModified('settings')
  await doc.save()
  return toClientShape(doc)
}
