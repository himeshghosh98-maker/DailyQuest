import { test } from 'node:test'
import assert from 'node:assert/strict'

import { levelProgress, totalXpForLevel, xpForLevel } from '../src/utils/xp.js'
import { gradeFor } from '../src/utils/grades.js'
import { currentStreak, bestStreak } from '../src/utils/stats.js'
import { isScheduledOn, scheduledTasks } from '../src/utils/schedule.js'
import { grantedXp, isComplete, normalizeTasks, taskPct } from '../src/utils/tasks.js'
import { sessionXp } from '../src/utils/focus.js'
import { addDays } from '../src/utils/date.js'

/* ===== XP / levels ===== */

test('level 1 starts at 0 xp with empty progress', () => {
  const p = levelProgress(0)
  assert.equal(p.level, 1)
  assert.equal(p.current, 0)
  assert.equal(p.needed, xpForLevel(1))
})

test('level curve is monotonically harder', () => {
  assert.ok(xpForLevel(10) > xpForLevel(2))
  assert.ok(xpForLevel(100) > xpForLevel(10))
})

test('levelProgress is consistent with totalXpForLevel', () => {
  const target = totalXpForLevel(5)
  const p = levelProgress(target)
  assert.equal(p.level, 5)
  assert.equal(p.current, 0)
})

test('pct stays within 0..100', () => {
  for (const xp of [0, 1, 99, 1234, 999999]) {
    const p = levelProgress(xp)
    assert.ok(p.pct >= 0 && p.pct <= 100)
    assert.ok(p.current >= 0 && p.current <= p.needed)
  }
})

/* ===== Grades ===== */

test('grade boundaries: S=100, A=80, B=60, C=40, D<40', () => {
  assert.equal(gradeFor(100), 'S')
  assert.equal(gradeFor(99), 'A')
  assert.equal(gradeFor(80), 'A')
  assert.equal(gradeFor(79), 'B')
  assert.equal(gradeFor(60), 'B')
  assert.equal(gradeFor(59), 'C')
  assert.equal(gradeFor(40), 'C')
  assert.equal(gradeFor(39), 'D')
  assert.equal(gradeFor(0), 'D')
})

/* ===== Streaks ===== */

const day = (date, pct) => ({ date, completionPct: pct })

test('currentStreak counts back from today at >= 80%', () => {
  const history = [
    day('2026-10-04', 100),
    day('2026-10-03', 80),
    day('2026-10-02', 79), // breaks the streak
    day('2026-10-01', 100),
  ]
  assert.equal(currentStreak(history, '2026-10-04'), 2)
})

test('streak survives through yesterday when today has no entry', () => {
  const history = [day('2026-10-03', 90), day('2026-10-02', 100)]
  assert.equal(currentStreak(history, '2026-10-04'), 2)
})

test('bestStreak finds the longest run', () => {
  const history = [
    day('2026-10-01', 80),
    day('2026-10-02', 90),
    day('2026-10-03', 100),
    day('2026-10-04', 10),
    day('2026-10-05', 100),
    day('2026-10-06', 85),
  ]
  assert.equal(bestStreak(history), 3)
})

/* ===== Schedule (repeat rules) ===== */

test('daily task is always scheduled; startDate guards the past', () => {
  const daily = { repeat: 'daily', startDate: '2026-10-01' }
  assert.equal(isScheduledOn(daily, '2026-10-04'), true)
  assert.equal(isScheduledOn(daily, '2026-09-30'), false)
})

test('weekdays = Mon-Fri, weekends = Sat-Sun (Mon-first indexes)', () => {
  // 2026-10-05 is a Monday, 2026-10-10 a Saturday
  assert.equal(isScheduledOn({ repeat: 'weekdays' }, '2026-10-05'), true)
  assert.equal(isScheduledOn({ repeat: 'weekdays' }, '2026-10-10'), false)
  assert.equal(isScheduledOn({ repeat: 'weekends' }, '2026-10-10'), true)
  assert.equal(isScheduledOn({ repeat: 'weekends' }, '2026-10-05'), false)
})

test('custom uses Monday-first day indexes; once matches its date', () => {
  assert.equal(isScheduledOn({ repeat: 'custom', days: [0, 2] }, '2026-10-05'), true) // Mon
  assert.equal(isScheduledOn({ repeat: 'custom', days: [0, 2] }, '2026-10-06'), false) // Tue
  assert.equal(isScheduledOn({ repeat: 'once', onceDate: '2026-10-07' }, '2026-10-07'), true)
  assert.equal(isScheduledOn({ repeat: 'once', onceDate: '2026-10-07' }, '2026-10-08'), false)
})

test('scheduledTasks filters by date', () => {
  const tasks = [
    { name: 'a', repeat: 'daily' },
    { name: 'b', repeat: 'once', onceDate: '2026-10-08' },
  ]
  const out = scheduledTasks(tasks, '2026-10-07').map((t) => t.name)
  assert.deepEqual(out, ['a'])
})

/* ===== XP grant rules ===== */

test('yesno grants full xp only when done', () => {
  assert.equal(grantedXp({ type: 'yesno', xp: 30, done: true }), 30)
  assert.equal(grantedXp({ type: 'yesno', xp: 30, done: false }), 0)
})

test('count/timed grant xp proportionally to progress, capped at task.xp', () => {
  // 4 of 8 → 50% of 16
  assert.equal(grantedXp({ type: 'count', xp: 16, target: 8, progress: 4 }), 8)
  // past target still caps at full xp
  assert.equal(grantedXp({ type: 'count', xp: 16, target: 8, progress: 20 }), 16)
  assert.equal(grantedXp({ type: 'timed', xp: 45, target: 45, minutes: 45 }), 45)
  assert.equal(grantedXp({ type: 'timed', xp: 45, target: 45, minutes: 0 }), 0)
})

test('isComplete: done flag for yesno, target reached for count/timed', () => {
  assert.equal(isComplete({ type: 'yesno', done: true }), true)
  assert.equal(isComplete({ type: 'count', target: 8, progress: 7 }), false)
  assert.equal(isComplete({ type: 'count', target: 8, progress: 8 }), true)
  assert.equal(isComplete({ type: 'timed', target: 45, minutes: 45 }), true)
})

test('taskPct clamps to 0..100', () => {
  assert.equal(taskPct({ type: 'yesno', done: false }), 0)
  assert.equal(taskPct({ type: 'count', target: 8, progress: 99 }), 100)
})

/* ===== Normalization ===== */

test('normalizeTasks clamps and defaults every field', () => {
  const [t] = normalizeTasks([{ name: ' Gym ', xp: 9999, type: 'timed', target: 0 }])
  assert.equal(t.xp, 200) // XP_MAX
  assert.equal(t.target, 1) // TARGET_MIN
  assert.equal(t.repeat, 'daily')
  assert.equal(t.timeOfDay, 'any')
  assert.equal(t.done, false)
  assert.ok(t.id)
})

test('normalizeTasks maps legacy tasks to yesno daily quests', () => {
  const [t] = normalizeTasks([{ name: 'Old' }])
  assert.equal(t.type, 'yesno')
  assert.equal(t.target, undefined)
  assert.equal(t.emoji, '✨')
})

test('normalizeTasks rejects non-arrays', () => {
  assert.throws(() => normalizeTasks('nope'))
})

/* ===== Focus XP ===== */

test('sub-minute sessions earn nothing', () => {
  assert.equal(sessionXp(0), 0)
  assert.equal(sessionXp(0.5), 0)
})

test('focus xp = 0.2/min + 5 completion bonus when pauses <= 3', () => {
  assert.equal(sessionXp(25), 5) // floor(25 * 0.2)
  assert.equal(sessionXp(25, { completed: true, pauses: 3 }), 10)
  assert.equal(sessionXp(25, { completed: true, pauses: 4 }), 5) // bonus forfeited
})

/* ===== Date helpers ===== */

test('addDays crosses month boundaries', () => {
  assert.equal(addDays('2026-10-01', -1), '2026-09-30')
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
})
