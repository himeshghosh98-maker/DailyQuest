import { BONUS_PERFECT_DAY, STREAK_THRESHOLD } from '../config/constants.js'
import { addDays, todayStr } from '../utils/date.js'
import { gradeFor } from '../utils/grades.js'
import { currentStreak, bestStreak } from '../utils/stats.js'
import { scheduledTasks } from '../utils/schedule.js'
import { grantedXp, isComplete, resultLabel, taskPct } from '../utils/tasks.js'
import { getStateDoc, saveStateDoc, toClientShape } from './state.service.js'

/**
 * Reports — the daily/weekly math mirrors the frontend exactly
 * (finishDay() in QuestContext.jsx, stats.js, grades.js), so API output and
 * on-screen numbers can never drift apart.
 */

function historyEntry(state, date) {
  return (state.history || []).find((h) => h.date === date) || null
}

function focusMinutesOn(state, date) {
  return (state.focusSessions || [])
    .filter((s) => s.date === date)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0)
}

/** Live (unfinished) summary for a date — same math as finishDay(). */
function liveSummary(state, date) {
  const dayTasks = scheduledTasks(state.tasks || [], date)
  const done = dayTasks.filter(isComplete)
  const pct =
    dayTasks.length > 0
      ? Math.round(dayTasks.reduce((s, t) => s + taskPct(t), 0) / dayTasks.length)
      : 0
  return {
    completedCount: done.length,
    totalCount: dayTasks.length,
    completionPct: pct,
    xpEarned: (state.tasks || []).reduce((sum, t) => sum + grantedXp(t), 0),
    grade: gradeFor(pct),
    perfect: dayTasks.length > 0 && done.length === dayTasks.length,
  }
}

/** Missed (scheduled but incomplete) tasks for a date. */
function missedTasks(state, date) {
  return scheduledTasks(state.tasks || [], date)
    .filter((t) => !isComplete(t))
    .map((t) => ({
      id: t.id,
      name: t.name,
      emoji: t.emoji,
      xp: t.xp,
      type: t.type,
      result: resultLabel(t),
    }))
}

/* ===== GET /reports/daily ===== */

export async function dailyReport(userId, date) {
  const doc = await getStateDoc(userId)
  const state = toClientShape(doc)
  const isToday = date === todayStr()

  const entry = historyEntry(state, date)
  const live = liveSummary(state, date)
  const summary = entry
    ? {
        completedCount: entry.completedCount,
        totalCount: entry.totalCount,
        completionPct: entry.completionPct,
        xpEarned: entry.xpEarned,
        bonusXp: entry.bonusXp || 0,
        grade: entry.grade,
        perfect: Boolean(entry.perfect),
      }
    : { ...live, bonusXp: 0 }

  return {
    date,
    logged: Boolean(entry) || isToday,
    entry, // exact frontend history-entry shape (or null)
    ...summary,
    xpTotal: summary.xpEarned + (summary.bonusXp || 0),
    streak: {
      current: currentStreak(state.history || [], state.lastActiveDate || todayStr()),
      best: bestStreak(state.history || []),
      threshold: STREAK_THRESHOLD,
    },
    focusMinutes: focusMinutesOn(state, date),
    missedTasks: entry
      ? (entry.tasks || []).filter((t) => !t.done).map((t) => ({
          name: t.name,
          emoji: t.emoji,
          xp: t.xp,
          type: t.type,
          result: t.result,
        }))
      : isToday
        ? missedTasks(state, date)
        : [],
  }
}

/* ===== GET /reports/weekly ===== */

export async function weeklyReport(userId, endDate) {
  const doc = await getStateDoc(userId)
  const state = toClientShape(doc)
  const end = endDate || todayStr()
  const start = addDays(end, -6)

  const days = []
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const entry = historyEntry(state, d)
    const live = d === todayStr() ? liveSummary(state, d) : null
    const summary = entry
      ? {
          completedCount: entry.completedCount,
          totalCount: entry.totalCount,
          completionPct: entry.completionPct,
          xpEarned: (entry.xpEarned || 0) + (entry.bonusXp || 0),
          grade: entry.grade,
          perfect: Boolean(entry.perfect),
        }
      : live
        ? {
            completedCount: live.completedCount,
            totalCount: live.totalCount,
            completionPct: live.completionPct,
            xpEarned: live.xpEarned,
            grade: null, // live days have no grade until finished (frontend rule)
            perfect: live.perfect,
          }
        : null
    days.push({
      date: d,
      focusMinutes: focusMinutesOn(state, d),
      ...(summary || {
        completedCount: 0,
        totalCount: 0,
        completionPct: 0,
        xpEarned: 0,
        grade: null,
        perfect: false,
      }),
      logged: Boolean(summary),
    })
  }

  const logged = days.filter((d) => d.logged)
  const avgPct = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.completionPct, 0) / logged.length)
    : 0
  const best = logged.reduce((top, d) => (!top || d.completionPct > top.completionPct ? d : top), null)

  return {
    range: { start, end },
    days,
    summary: {
      loggedDays: logged.length,
      avgCompletionPct: avgPct,
      grade: gradeFor(avgPct),
      totalXp: days.reduce((s, d) => s + (d.xpEarned || 0), 0),
      totalFocusMinutes: days.reduce((s, d) => s + d.focusMinutes, 0),
      perfectDays: days.filter((d) => d.perfect).length,
      bestDay: best ? { date: best.date, completionPct: best.completionPct } : null,
      currentStreak: currentStreak(state.history || [], state.lastActiveDate || todayStr()),
      bestStreak: bestStreak(state.history || []),
    },
  }
}

/* ===== POST /reports/finish-day ===== */

/**
 * Finish (or re-finish) today — mirrors finishDay() byte-for-byte,
 * including the perfect-day bonus adjustment on re-finish.
 */
export async function finishDay(userId) {
  const doc = await getStateDoc(userId)
  const date = todayStr()
  const state = toClientShape(doc)

  const dayTasks = scheduledTasks(state.tasks || [], date)
  const done = dayTasks.filter(isComplete)
  const pct =
    dayTasks.length > 0
      ? Math.round(dayTasks.reduce((s, t) => s + taskPct(t), 0) / dayTasks.length)
      : 0
  const perfect = dayTasks.length > 0 && done.length === dayTasks.length
  const bonusXp = perfect ? BONUS_PERFECT_DAY : 0

  const entry = {
    date,
    finishedAt: new Date().toISOString(),
    tasks: dayTasks.map((t) => ({
      name: t.name,
      emoji: t.emoji,
      xp: t.xp,
      done: isComplete(t),
      type: t.type,
      target: t.target,
      unit: t.unit,
      result: resultLabel(t),
    })),
    completedCount: done.length,
    totalCount: dayTasks.length,
    completionPct: pct,
    xpEarned: (state.tasks || []).reduce((sum, t) => sum + grantedXp(t), 0),
    bonusXp,
    grade: gradeFor(pct),
    perfect,
  }

  const previous = historyEntry(state, date)
  const history = previous
    ? state.history.map((h) => (h.date === date ? entry : h))
    : [...state.history, entry]

  doc.history = history
  // Task XP is granted live; only the perfect-day bonus adjusts on re-finish.
  doc.totalXp = Math.max(
    0,
    (Number(doc.totalXp) || 0) - (previous?.bonusXp || 0) + bonusXp,
  )
  await saveStateDoc(doc)

  return {
    entry,
    totalXp: Math.max(0, Number(doc.totalXp) || 0),
    streak: {
      current: currentStreak(history, doc.lastActiveDate || date),
      best: bestStreak(history),
    },
    focusMinutes: focusMinutesOn(state, date),
    missedTasks: entry.tasks.filter((t) => !t.done),
  }
}
