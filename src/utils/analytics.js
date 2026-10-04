import { addDays, shortLabel, todayStr } from './date'

/**
 * Merge saved history with today's live progress so charts/heatmap always
 * include the current day. Returns Map<dateStr, {pct, xp, grade, perfect}>.
 */
export function buildDayMap(history, liveToday) {
  const map = new Map()
  for (const h of history) {
    map.set(h.date, {
      pct: h.completionPct,
      xp: h.xpEarned + (h.bonusXp || 0),
      grade: h.grade,
      perfect: Boolean(h.perfect),
    })
  }
  if (liveToday && liveToday.totalCount > 0) {
    map.set(liveToday.date, {
      pct: liveToday.completionPct,
      xp: liveToday.xpEarned,
      grade: null,
      perfect: liveToday.completedCount === liveToday.totalCount,
    })
  }
  return map
}

/** Last `days` daily points (oldest first) for line/bar charts. */
export function dailySeries(dayMap, days = 30, today = todayStr()) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const d = dayMap.get(date)
    out.push({
      date,
      label: shortLabel(date),
      pct: d ? d.pct : 0,
      xp: d ? d.xp : 0,
      active: Boolean(d),
    })
  }
  return out
}

/**
 * Aggregate the last `weeks` weeks (current week is partial, ending today).
 * Each point: { label, pct (avg), xp (sum), activeDays }.
 */
export function weeklySeries(dayMap, weeks = 8, today = todayStr()) {
  const out = []
  for (let w = weeks - 1; w >= 0; w--) {
    const end = addDays(today, -7 * w)
    const start = addDays(end, -6)
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, d)
      const entry = dayMap.get(date)
      if (entry) days.push(entry)
    }
    out.push({
      label:
        w === 0
          ? 'This week'
          : `${shortLabel(start).split(' ')[0]} ${start.slice(8)}`,
      pct: days.length ? Math.round(days.reduce((s, d) => s + d.pct, 0) / days.length) : 0,
      xp: days.reduce((s, d) => s + d.xp, 0),
      activeDays: days.length,
    })
  }
  return out
}

/** Aggregate the last `months` calendar months (current month partial). */
export function monthlySeries(dayMap, months = 6, today = todayStr()) {
  const out = []
  const now = new Date()
  for (let m = months - 1; m >= 0; m--) {
    const first = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const prefix = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}`
    const days = [...dayMap.entries()].filter(([date]) => date.startsWith(prefix)).map(([, v]) => v)
    out.push({
      label: first.toLocaleDateString(undefined, { month: 'short' }),
      pct: days.length ? Math.round(days.reduce((s, d) => s + d.pct, 0) / days.length) : 0,
      xp: days.reduce((s, d) => s + d.xp, 0),
      activeDays: days.length,
    })
  }
  return out
}

/**
 * Per-task lifetime stats from history snapshots plus today's live tasks.
 * Returns [{ name, emoji, done, opportunities, rate }] sorted by rate desc.
 */
export function taskStats(history, tasks, today = todayStr()) {
  const byName = new Map()
  const ensure = (name, emoji) => {
    if (!byName.has(name)) byName.set(name, { name, emoji: emoji || '✨', done: 0, opportunities: 0 })
    return byName.get(name)
  }
  for (const h of history) {
    if (h.date === today) continue
    for (const t of h.tasks || []) {
      const stat = ensure(t.name, t.emoji)
      stat.opportunities++
      if (t.done) stat.done++
    }
  }
  for (const t of tasks) {
    const stat = ensure(t.name, t.emoji)
    stat.opportunities++
    if (t.done) stat.done++
  }
  return [...byName.values()]
    .map((s) => ({ ...s, rate: s.opportunities ? Math.round((s.done / s.opportunities) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate || b.opportunities - a.opportunities)
}

/**
 * The headline lifetime stats for the Progress page.
 * "Most consistent" = highest completion rate (min 2 opportunities);
 * "Most skipped" = lowest rate with at least 2 opportunities.
 */
export function lifetimeStats(history, tasks, dayMap, today = todayStr()) {
  const stats = taskStats(history, tasks, today)
  const eligible = stats.filter((s) => s.opportunities >= 2)
  const daysLogged = dayMap.size

  return {
    bestStreakDays: null, // filled by caller (needs bestStreak util)
    daysLogged,
    perfectDays: [...dayMap.values()].filter((d) => d.perfect).length,
    totalXpFromDays: [...dayMap.values()].reduce((s, d) => s + d.xp, 0),
    mostConsistent: eligible[0] || null,
    mostSkipped: eligible.length > 1 ? eligible[eligible.length - 1] : null,
    taskStats: stats,
  }
}
