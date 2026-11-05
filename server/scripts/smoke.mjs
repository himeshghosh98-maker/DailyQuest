/**
 * API smoke test — run with the server up:
 *   node scripts/smoke.mjs [baseUrl]
 * Exits non-zero on the first failed assertion.
 */
const BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '')

let failures = 0
let checks = 0
function assert(cond, label, extra) {
  checks++
  if (cond) console.log(`  ✔ ${label}`)
  else {
    failures++
    console.error(`  ✖ ${label}`, extra !== undefined ? JSON.stringify(extra) : '')
  }
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  return { status: res.status, data }
}

const stamp = Date.now()
const name = `smoke-${stamp}`
const password = 'smoke-pass-1'

/* ===== Auth ===== */
console.log('auth')
{
  const r = await call('POST', '/auth/signup', { body: { name, password } })
  assert(r.status === 201 && r.data.token, 'signup creates account + token')
  var TOKEN = r.data.token
}
{
  const r = await call('POST', '/auth/login', { body: { name: name.toUpperCase(), password } })
  assert(r.status === 200 && r.data.token, 'login is case-insensitive')
}
{
  const r = await call('POST', '/auth/login', { body: { name, password: 'nope-nope' } })
  assert(r.status === 401 && r.data.code === 'BAD_PASSWORD', 'wrong passcode rejected')
}
{
  const r = await call('GET', '/tasks')
  assert(r.status === 401, 'protected routes reject missing token')
}

/* ===== Tasks CRUD ===== */
console.log('tasks')
let taskId
{
  const r = await call('POST', '/tasks', {
    token: TOKEN,
    body: { name: 'Meditate', emoji: '🧘', xp: 20, type: 'count', target: 10, unit: 'min', repeat: 'weekdays', days: [0, 2, 4] },
  })
  assert(r.status === 201, 'create task')
  const t = r.data.task
  taskId = t?.id
  assert(t?.type === 'count' && t.target === 10 && t.unit === 'min', 'count fields stored exactly')
  assert(t.repeat === 'weekdays' && JSON.stringify(t.days) === '[0,2,4]', 'repeat rule stored exactly')
  assert(t.progress === 0 && t.done === false && typeof t.startDate === 'string', 'progress initialized')
}
{
  const r = await call('GET', '/tasks', { token: TOKEN })
  assert(r.status === 200 && Array.isArray(r.data.tasks) && r.data.tasks.some((t) => t.id === taskId), 'list tasks')
}
{
  const r = await call('PUT', `/tasks/${taskId}`, { token: TOKEN, body: { xp: 40, name: 'Meditate more' } })
  assert(r.status === 200 && r.data.task.xp === 40 && r.data.task.name === 'Meditate more', 'update task')
}

/* ===== Progress + XP rules ===== */
console.log('progress (XP settle rules)')
{
  // 5 of 10 → 50% of 40 xp granted
  const r = await call('PUT', `/progress/${taskId}/count`, { token: TOKEN, body: { value: 5 } })
  assert(r.status === 200 && r.data.task.progress === 5, 'set count progress')
  assert(r.data.grantedXp === 20 && r.data.totalXp === 20, 'half progress grants half xp', r.data)
}
{
  const r = await call('POST', `/progress/${taskId}/complete`, { token: TOKEN, body: { done: true } })
  assert(r.status === 200 && r.data.task.progress === 10, 'complete jumps to target')
  assert(r.data.grantedXp === 40 && r.data.totalXp === 40, 'full progress grants full xp', r.data)
}
{
  const r = await call('POST', `/progress/${taskId}/complete`, { token: TOKEN, body: { done: false } })
  assert(r.status === 200 && r.data.task.progress === 0, 'undo resets progress')
  assert(r.data.grantedXp === 0 && r.data.totalXp === 0, 'undo removes granted xp', r.data)
}

let yesnoId
{
  const r = await call('POST', '/tasks', { token: TOKEN, body: { name: 'Run', emoji: '🏃', xp: 25, type: 'yesno' } })
  yesnoId = r.data.task.id
  const r2 = await call('POST', `/progress/${yesnoId}/toggle`, { token: TOKEN, body: { done: true } })
  assert(r2.status === 200 && r2.data.totalXp === 25, 'yesno done grants full xp', r2.data)
  const r3 = await call('POST', `/progress/${yesnoId}/toggle`, { token: TOKEN, body: { done: false } })
  assert(r3.status === 200 && r3.data.totalXp === 0, 'yesno undo removes xp', r3.data)
}

let timedId
{
  const r = await call('POST', '/tasks', { token: TOKEN, body: { name: 'Gym', emoji: '💪', xp: 45, type: 'timed', target: 45 } })
  timedId = r.data.task.id
  const r2 = await call('PUT', `/progress/${timedId}/minutes`, { token: TOKEN, body: { value: 15 } })
  assert(r2.status === 200 && r2.data.grantedXp === 15 && r2.data.totalXp === 15, 'timed xp scales with minutes', r2.data)
}
{
  const r = await call('POST', `/progress/${timedId}/timer`, { token: TOKEN, body: { action: 'start' } })
  assert(r.status === 200 && r.data.task.timer, 'timer starts with a wall-clock stamp')
  const r2 = await call('POST', `/progress/${timedId}/timer`, { token: TOKEN, body: { action: 'stop' } })
  assert(r2.status === 200 && r2.data.task.timer === null, 'timer stops and clears')
}
{
  const r = await call('PUT', `/progress/${yesnoId}/count`, { token: TOKEN, body: { value: 1 } })
  assert(r.status === 400, 'count endpoint rejects non-count tasks')
}

/* ===== Stats ===== */
console.log('stats')
{
  const r = await call('GET', '/stats', { token: TOKEN })
  assert(r.status === 200, 'stats responds')
  assert(typeof r.data.level?.level === 'number' && typeof r.data.level?.pct === 'number', 'level shape {level,current,needed,pct}', r.data.level)
  assert(typeof r.data.streak?.current === 'number' && typeof r.data.streak?.best === 'number', 'streak shape {current,best}')
  assert(r.data.badges?.total === 10 && Array.isArray(r.data.badges?.catalog), 'badge catalog present')
  assert(typeof r.data.today?.completionPct === 'number' && typeof r.data.today?.grade === 'string', 'today summary shape')
  assert(r.data.totalXp === 15, 'stats totalXp matches last settle', r.data.totalXp)
}

/* ===== Delete ===== */
{
  const r = await call('DELETE', `/tasks/${timedId}`, { token: TOKEN })
  assert(r.status === 200, 'delete task')
  assert(r.data.totalXp === 0, 'deleting a task removes its granted xp', r.data)
}

/* ===== Focus sessions ===== */
console.log('focus sessions')
let focusTaskId
{
  const r = await call('POST', '/tasks', { token: TOKEN, body: { name: 'Deep Work', emoji: '🧠', xp: 50, type: 'timed', target: 50 } })
  focusTaskId = r.data.task.id
  assert(r.status === 201, 'create timed task for focus')
}
{
  const r = await call('POST', '/focus/start', { token: TOKEN, body: { task: { id: focusTaskId, name: 'Deep Work', emoji: '🧠' }, mode: 'pomodoro' } })
  assert(r.status === 201 && r.data.focus?.running === true && r.data.focus?.taskId === focusTaskId, 'start creates active session', r.data)
}
{
  // 25 focused minutes, completed with 1 pause: floor(25*0.2)=5 + 5 bonus
  // + timed task progress 25/50 → grantedXp 25 ⇒ total 35
  const r = await call('POST', '/focus/stop', { token: TOKEN, body: { completed: true, elapsedMs: 25 * 60000, pauses: 1 } })
  assert(r.status === 200 && r.data.minutes === 25, 'stop reports focused minutes', r.data)
  assert(r.data.xp === 10, 'session xp = per-minute + completion bonus', r.data.xp)
  const task = r.data.state.tasks.find((t) => t.id === focusTaskId)
  assert(task.minutes === 25, 'focused minutes logged onto timed task')
  assert(r.data.state.totalXp === 35, 'total xp = session xp + task progress xp', r.data.state.totalXp)
  assert(r.data.state.focus === null, 'active session cleared')
}
{
  const r = await call('GET', '/focus/sessions', { token: TOKEN })
  assert(r.status === 200 && r.data.sessions.length === 1, 'history returns the record')
  const s = r.data.sessions[0]
  assert(s.minutes === 25 && s.completed === true && s.mode === 'pomodoro' && typeof s.startedAt === 'string', 'record shape matches frontend', s)
  assert(r.data.active === null && r.data.totalMinutes === 25, 'totals aggregated')
}
{
  const r = await call('POST', '/focus/stop', { token: TOKEN, body: {} })
  assert(r.status === 404, 'stop without active session is a 404')
}
{
  const r = await call('POST', '/focus/start', { token: TOKEN, body: { task: { id: focusTaskId, name: 'Deep Work' }, mode: 'stopwatch' } })
  assert(r.status === 201, 'start again after stop')
  const r2 = await call('POST', '/focus/start', { token: TOKEN, body: { task: { id: focusTaskId, name: 'Deep Work' }, mode: 'custom', customMin: 45 } })
  assert(r2.status === 201 && r2.data.focus.mode === 'custom' && r2.data.focus.customMin === 45, 'replacing a session keeps the new one active', r2.data.focus)
  const r3 = await call('POST', '/focus/stop', { token: TOKEN, body: { elapsedMs: 59_000 } })
  assert(r3.status === 200 && r3.data.session === null && r3.data.xp === 0, 'sub-minute sessions log nothing (anti-farm)', r3.data)
}

/* ===== Reports ===== */
console.log('reports')
const todayIso = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()
// Meditate is weekdays-only (created in the tasks section), so how many tasks
// are scheduled today — and today's exact % — depends on the run day.
const scheduledToday = (() => {
  const [y, m, d] = todayIso.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7 <= 4 ? 3 : 2
})()
// Run 0/1 + Deep Work 25/50 (+ Meditate 0/10 on weekdays) → avg of taskPct.
const expectedPct = scheduledToday === 3 ? 17 : 25
{
  const r = await call('GET', `/reports/daily?date=${todayIso}`, { token: TOKEN })
  assert(r.status === 200, 'daily report responds')
  // Scheduled today: Run (0/1) + Deep Work (25/50); Meditate on weekdays only.
  assert(r.data.totalCount === scheduledToday, 'only tasks scheduled today count', r.data)
  assert(r.data.completionPct === expectedPct && r.data.grade === 'D', 'completion % + grade match frontend math', r.data)
  assert(r.data.focusMinutes === 25, 'daily report includes focus time', r.data.focusMinutes)
  assert(Array.isArray(r.data.missedTasks) && r.data.missedTasks.length === scheduledToday, 'missed tasks listed', r.data.missedTasks)
  assert(r.data.streak && typeof r.data.streak.current === 'number', 'streak included')
  assert(r.data.entry === null, 'no history entry before finish-day')
}
{
  const r = await call('POST', '/reports/finish-day', { token: TOKEN })
  assert(r.status === 200 && r.data.entry?.date === todayIso, 'finish-day writes today\'s entry')
  assert(r.data.entry.grade === 'D' && r.data.entry.perfect === false && r.data.entry.bonusXp === 0, 'no bonus on imperfect day', r.data.entry)
  assert(r.data.entry.tasks.length === scheduledToday && r.data.entry.completedCount === 0, 'entry snapshots scheduled tasks')
  assert(r.data.totalXp === 35, 're-finish does not change xp without bonus', r.data.totalXp)
  assert(r.data.missedTasks.length === scheduledToday, 'finish-day reports missed tasks')
}
{
  const r = await call('GET', `/reports/daily?date=${todayIso}`, { token: TOKEN })
  assert(r.data.entry !== null && r.data.logged === true, 'daily report returns the stored entry')
}
{
  const r = await call('GET', '/reports/weekly', { token: TOKEN })
  assert(r.status === 200 && r.data.days.length === 7, 'weekly report covers 7 days')
  const s = r.data.summary
  assert(s.loggedDays === 1 && s.avgCompletionPct === expectedPct && s.grade === 'D', 'weekly aggregates logged days only', s)
  assert(s.totalFocusMinutes === 25, 'weekly focus time summed', s.totalFocusMinutes)
  assert(typeof s.totalXp === 'number' && typeof s.bestStreak === 'number', 'weekly xp + streak present')
}
{
  const r = await call('GET', '/reports/daily?date=2026-13-99', { token: TOKEN })
  assert(r.status === 400 && r.data.code === 'VALIDATION', 'invalid calendar date rejected', r.data)
}

/* ===== AI ===== */
console.log('ai')
{
  const r = await call('POST', '/ai/insights', { token: TOKEN })
  assert(r.status === 200, 'insights responds')
  assert(Array.isArray(r.data.insights) && r.data.insights.length >= 2 && r.data.insights.length <= 4, '2-4 insights', r.data)
  assert(r.data.insights.every((s) => typeof s === 'string' && s.length > 10), 'insights are sentences', r.data.insights)
  assert(['gemini', 'rules'].includes(r.data.source), 'source flagged', r.data.source)
  var aiSource = r.data.source
}
{
  const r = await call('POST', '/ai/insights', { token: TOKEN })
  assert(r.data.cached === true, 'second insights call is served from cache', r.data)
}
{
  const r = await call('GET', '/ai/weekly-summary', { token: TOKEN })
  assert(r.status === 200 && typeof r.data.summary === 'string' && r.data.summary.length > 20, 'weekly summary text', r.data)
  assert(r.data.range && typeof r.data.range.start === 'string', 'summary has its date range')
}
{
  const r = await call('POST', '/ai/suggest-tasks', { token: TOKEN })
  assert(r.status === 200 && Array.isArray(r.data.suggestions) && r.data.suggestions.length >= 1, 'task suggestions returned', r.data)
  const s = r.data.suggestions[0]
  assert(typeof s.name === 'string' && s.xp >= 5 && s.xp <= 200 && ['yesno', 'count', 'timed'].includes(s.type), 'suggestion respects task rules', s)
  assert(typeof s.reason === 'string' && s.reason.length > 0, 'suggestion carries a reason', s)
}
{
  const r = await call('POST', '/ai/insights', {})
  assert(r.status === 401, 'ai routes require auth')
}

console.log(`\n${checks - failures}/${checks} checks passed`)
if (failures > 0) process.exit(1)
