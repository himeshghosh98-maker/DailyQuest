import crypto from 'node:crypto'
import ApiError from '../utils/ApiError.js'
import { todayStr } from '../utils/date.js'
import { grantedXp, normalizeTasks } from '../utils/tasks.js'
import { getStateDoc, saveStateDoc } from './state.service.js'

function uid() {
  return crypto.randomUUID()
}

/**
 * Build a fully-defaulted task — mirrors the frontend's makeTask() in
 * QuestContext.jsx (id is preserved when the client already generated one).
 */
function makeTask(input = {}) {
  const type = input.type || 'yesno'
  const xp = Math.min(200, Math.max(5, Math.round(Number(input.xp)) || 10))
  const hasTarget = type !== 'yesno'
  const target = hasTarget ? Math.min(999, Math.max(1, Math.round(Number(input.target)) || 1)) : undefined
  const [task] = normalizeTasks([
    {
      id: typeof input.id === 'string' && input.id ? input.id : uid(),
      name: input.name,
      emoji: input.emoji,
      xp,
      type,
      target,
      unit: input.unit,
      repeat: input.repeat,
      days: input.days,
      onceDate: input.onceDate,
      startDate: input.startDate || todayStr(),
      timeOfDay: input.timeOfDay,
      progress: type === 'count' ? 0 : undefined,
      minutes: type === 'timed' ? 0 : undefined,
      timer: null,
      done: false,
    },
  ])
  return task
}

function findTask(doc, id) {
  const idx = (doc.tasks || []).findIndex((t) => t && t.id === id)
  if (idx === -1) throw ApiError.notFound('Task not found')
  return idx
}

/**
 * Replace tasks[idx] with `next` and apply the frontend's XP settle rule:
 * totalXp += grantedXp(next) - grantedXp(prev), floored at 0.
 */
function settleInDoc(doc, idx, next) {
  const prev = doc.tasks[idx]
  const delta = grantedXp(next) - grantedXp(prev)
  const tasks = [...doc.tasks]
  tasks[idx] = next
  doc.tasks = tasks
  doc.totalXp = Math.max(0, (Number(doc.totalXp) || 0) + delta)
  return next
}

function shape(doc, task) {
  return { task, totalXp: Math.max(0, Number(doc.totalXp) || 0), grantedXp: grantedXp(task) }
}

/* ===== CRUD ===== */

export async function listTasks(userId) {
  const doc = await getStateDoc(userId)
  return { tasks: doc.tasks || [], totalXp: Math.max(0, Number(doc.totalXp) || 0) }
}

export async function createTask(userId, payload) {
  const doc = await getStateDoc(userId)
  const task = makeTask(payload)
  doc.tasks = [...(doc.tasks || []), task]
  await saveStateDoc(doc)
  return shape(doc, task)
}

export async function updateTask(userId, id, patch) {
  const doc = await getStateDoc(userId)
  const idx = findTask(doc, id)
  // Merge like the frontend UPDATE_TASK, then clear any running timer.
  const [next] = normalizeTasks([{ ...doc.tasks[idx], ...patch, id, timer: null }])
  const task = settleInDoc(doc, idx, next)
  await saveStateDoc(doc)
  return shape(doc, task)
}

export async function deleteTask(userId, id) {
  const doc = await getStateDoc(userId)
  const idx = findTask(doc, id)
  const task = doc.tasks[idx]
  // Removing a task removes the XP it currently grants (frontend rule).
  doc.tasks = doc.tasks.filter((_, i) => i !== idx)
  doc.totalXp = Math.max(0, (Number(doc.totalXp) || 0) - grantedXp(task))
  await saveStateDoc(doc)
  return { id, totalXp: Math.max(0, Number(doc.totalXp) || 0) }
}

/* ===== Progress (mirrors the reducer's settle() actions) ===== */

function getTask(doc, id) {
  const idx = findTask(doc, id)
  return { idx, task: doc.tasks[idx] }
}

/** Yes/No checkbox toggle (TOGGLE_TASK) or explicit set. */
export async function setDone(userId, id, done) {
  const doc = await getStateDoc(userId)
  const { idx, task } = getTask(doc, id)
  const next = { ...task, done: Boolean(done) }
  const updated = settleInDoc(doc, idx, next)
  await saveStateDoc(doc)
  return shape(doc, updated)
}

/** Count stepper (SET_PROGRESS): non-negative integer, XP settles. */
export async function setCount(userId, id, value) {
  const doc = await getStateDoc(userId)
  const { idx, task } = getTask(doc, id)
  if (task.type !== 'count') throw ApiError.badRequest('This task is not a count task.')
  const next = { ...task, progress: Math.max(0, Math.round(Number(value) || 0)) }
  const updated = settleInDoc(doc, idx, next)
  await saveStateDoc(doc)
  return shape(doc, updated)
}

/** Timed minutes (SET_MINUTES): non-negative integer, timer cleared. */
export async function setMinutes(userId, id, value) {
  const doc = await getStateDoc(userId)
  const { idx, task } = getTask(doc, id)
  if (task.type !== 'timed') throw ApiError.badRequest('This task is not a timed task.')
  const next = { ...task, minutes: Math.max(0, Math.round(Number(value) || 0)), timer: null }
  const updated = settleInDoc(doc, idx, next)
  await saveStateDoc(doc)
  return shape(doc, updated)
}

/**
 * Timed-task wall-clock timer (START_TIMER / STOP_TIMER).
 * action: 'start' stores the timestamp; 'stop' banks elapsed whole minutes.
 */
export async function controlTimer(userId, id, action) {
  const doc = await getStateDoc(userId)
  const { idx, task } = getTask(doc, id)
  if (task.type !== 'timed') throw ApiError.badRequest('This task is not a timed task.')

  let next = task
  if (action === 'start') {
    if (!task.timer) next = { ...task, timer: String(Date.now()) }
  } else if (action === 'stop') {
    if (task.timer) {
      const elapsedMin = Math.max(0, Math.floor((Date.now() - Number(task.timer)) / 60000))
      next = { ...task, minutes: (Number(task.minutes) || 0) + elapsedMin, timer: null }
    }
  } else {
    throw ApiError.badRequest('action must be "start" or "stop"')
  }

  const updated = settleInDoc(doc, idx, next)
  await saveStateDoc(doc)
  return shape(doc, updated)
}

/**
 * Mark complete / undo completion for ANY task type
 * (POST /progress/:id/complete). Mirrors how the UI completes tasks:
 * - yesno → done flag
 * - count/timed → progress jumps to target (done) or back to 0 (undo)
 */
export async function completeTask(userId, id, done = true) {
  const doc = await getStateDoc(userId)
  const { idx, task } = getTask(doc, id)

  let next
  if (task.type === 'yesno') {
    next = { ...task, done: Boolean(done) }
  } else {
    const target = Math.max(1, Math.round(Number(task.target) || 1))
    next =
      done
        ? task.type === 'count'
          ? { ...task, progress: target }
          : { ...task, minutes: target, timer: null }
        : task.type === 'count'
          ? { ...task, progress: 0 }
          : { ...task, minutes: 0, timer: null }
  }

  const updated = settleInDoc(doc, idx, next)
  await saveStateDoc(doc)
  return shape(doc, updated)
}
