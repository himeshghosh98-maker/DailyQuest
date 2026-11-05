import { GoogleGenAI } from '@google/genai'
import env from '../config/env.js'
import { STREAK_THRESHOLD } from '../config/constants.js'
import { addDays, todayStr } from '../utils/date.js'
import { currentStreak, bestStreak } from '../utils/stats.js'
import { levelProgress } from '../utils/xp.js'
import { grantedXp, isComplete, taskPct } from '../utils/tasks.js'
import { scheduledTasks } from '../utils/schedule.js'
import { getState } from './state.service.js'
import { getCached, setCached } from './cache.service.js'

/**
 * AI features — the Gemini key NEVER leaves this file/server.
 * Every endpoint: cache hit → return; else build a compact digest of the
 * user's recent history, ask Gemini (if a key is configured) or fall back
 * to deterministic rules, cache the result for a few hours, return it.
 */

const DAY = 1000 * 60 * 60 * 24

/* ===== digest: everything the model needs, in compact text ===== */

function completionRates(state, since) {
  const rates = new Map() // name → { emoji, done, opportunities, type, target }
  for (const h of state.history || []) {
    if (h.date < since) continue
    for (const t of h.tasks || []) {
      const r = rates.get(t.name) || {
        name: t.name,
        emoji: t.emoji,
        type: t.type,
        target: t.target,
        done: 0,
        opportunities: 0,
      }
      r.opportunities++
      if (t.done) r.done++
      rates.set(t.name, r)
    }
  }
  return [...rates.values()].map((r) => ({
    ...r,
    rate: r.opportunities ? Math.round((r.done / r.opportunities) * 100) : 0,
  }))
}

function focusByDay(state, from, to) {
  const out = new Map()
  for (const s of state.focusSessions || []) {
    if (s.date < from || s.date > to) continue
    out.set(s.date, (out.get(s.date) || 0) + (Number(s.minutes) || 0))
  }
  return out
}

function buildDigest(state) {
  const today = todayStr()
  const last14 = addDays(today, -13)
  const last7 = addDays(today, -6)

  const hist14 = (state.history || [])
    .filter((h) => h.date >= last14 && h.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const liveToday = scheduledTasks(state.tasks || [], today)
  const rates = completionRates(state, last14)
  const focus = focusByDay(state, last14, today)
  const streak = currentStreak(state.history || [], state.lastActiveDate || today)

  const lines = []
  lines.push(`Today: ${today}`)
  lines.push(`Level: ${levelProgress(state.totalXp || 0).level} | Total XP: ${state.totalXp || 0}`)
  lines.push(
    `Streak: current ${streak}d (needs >=${STREAK_THRESHOLD}% completion/day), best ${bestStreak(state.history || [])}d`,
  )
  lines.push('')
  lines.push('Tasks (completion over last 14 days):')
  for (const r of rates) {
    lines.push(
      `- ${r.name} (${r.emoji}) type=${r.type} target=${r.target ?? '-'} done ${r.done}/${r.opportunities} = ${r.rate}%`,
    )
  }
  lines.push('')
  lines.push('Daily history (last 14 days): date | completion% | grade | focus min | missed')
  for (const h of hist14) {
    const missed = (h.tasks || []).filter((t) => !t.done).map((t) => t.name)
    lines.push(
      `${h.date} | ${h.completionPct}% | ${h.grade} | ${focus.get(h.date) || 0} | ${missed.join(', ') || 'none'}`,
    )
  }
  if (liveToday.length) {
    const missedNow = liveToday.filter((t) => !isComplete(t)).map((t) => t.name)
    const pct =
      liveToday.length > 0
        ? Math.round(liveToday.reduce((s, t) => s + taskPct(t), 0) / liveToday.length)
        : 0
    lines.push(`TODAY (live) | ${pct}% | focus ${focus.get(today) || 0} | not done: ${missedNow.join(', ') || 'none'}`)
  }
  lines.push('')
  const focus7 = focusByDay(state, last7, today)
  lines.push(
    `Focus minutes last 7 days: ${[...focus7.values()].reduce((s, m) => s + m, 0)} min`,
  )
  return lines.join('\n')
}

/* ===== Gemini ===== */

async function callGemini(system, prompt, maxTokens = 2048) {
  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey })
  const res = await ai.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: {
      systemInstruction: system,
      // Thinking tokens count toward maxOutputTokens — keep them off so the
      // JSON answer never gets truncated (finishReason MAX_TOKENS).
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: maxTokens,
      abortSignal: AbortSignal.timeout(30_000),
    },
  })
  const text = (res.text || '').trim()
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

/** Pull the first JSON object/array out of a model reply (fences or not). */
function extractJson(text) {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '')
  const objStart = cleaned.indexOf('{')
  const arrStart = cleaned.indexOf('[')
  const start =
    objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart)
  if (start === -1) return null
  const open = cleaned[start]
  const close = open === '{' ? '}' : ']'
  const end = cleaned.lastIndexOf(close)
  if (end <= start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

/* ===== deterministic fallbacks (no API key needed) ===== */

function weekdayName(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' })
}

function rulesInsights(state) {
  const today = todayStr()
  const last14 = addDays(today, -13)
  const hist = (state.history || []).filter((h) => h.date >= last14 && h.date <= today)
  const rates = completionRates(state, last14)
  const streak = currentStreak(state.history || [], state.lastActiveDate || today)
  const out = []

  // 1. Most-missed task pattern.
  const mostMissed = [...rates].filter((r) => r.opportunities >= 3).sort((a, b) => a.rate - b.rate)[0]
  if (mostMissed && mostMissed.rate < 80) {
    out.push(
      `“${mostMissed.name}” is slipping: done only ${mostMissed.done}/${mostMissed.opportunities} times (${mostMissed.rate}%) in the last 14 days.`,
    )
  }

  // 2. Best day of the week.
  const byWeekday = new Map()
  for (const h of hist) {
    const w = weekdayName(h.date)
    const arr = byWeekday.get(w) || []
    arr.push(h.completionPct)
    byWeekday.set(w, arr)
  }
  let best = null
  for (const [w, pcts] of byWeekday) {
    if (pcts.length < 2) continue
    const avg = Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
    if (!best || avg > best.avg) best = { w, avg }
  }
  if (best) out.push(`${best.w}s are your strongest days — averaging ${best.avg}% completion.`)

  // 3. Streak risk.
  const live = scheduledTasks(state.tasks || [], today)
  const livePct = live.length
    ? Math.round(live.reduce((s, t) => s + taskPct(t), 0) / live.length)
    : 0
  if (streak > 0 && livePct < STREAK_THRESHOLD) {
    out.push(
      `Streak risk: your ${streak}-day streak survives only at ${STREAK_THRESHOLD}%+ — today you're at ${livePct}%, so finish ${live.filter((t) => !isComplete(t)).length} more quest(s) to keep it alive.`,
    )
  } else if (streak === 0 && hist.length) {
    out.push(`No streak yet — hit ${STREAK_THRESHOLD}% completion two days in a row to start one.`)
  } else {
    out.push(`Streak steady at ${streak} day(s) — keep clearing ${STREAK_THRESHOLD}%+ to extend it.`)
  }

  // 4. Focus trend.
  const focus7 = focusByDay(state, addDays(today, -6), today)
  const totalFocus = [...focus7.values()].reduce((s, m) => s + m, 0)
  if (totalFocus > 0) {
    out.push(`You logged ${Math.floor(totalFocus / 60)}h ${totalFocus % 60}m of focus time in the last 7 days.`)
  }

  return out.slice(0, 4)
}

function rulesWeeklySummary(state) {
  const today = todayStr()
  const start = addDays(today, -6)
  const hist = (state.history || []).filter((h) => h.date >= start && h.date <= today)
  const focus = focusByDay(state, start, today)
  const focusTotal = [...focus.values()].reduce((s, m) => s + m, 0)

  if (!hist.length) {
    return `No finished days in the last week (${start} → ${today}). Finish a day from the report screen to start building your weekly picture.`
  }

  const avg = Math.round(hist.reduce((s, h) => s + h.completionPct, 0) / hist.length)
  const xp = hist.reduce((s, h) => s + (h.xpEarned || 0) + (h.bonusXp || 0), 0)
  const best = hist.reduce((top, h) => (h.completionPct > top.completionPct ? h : top), hist[0])
  const perfect = hist.filter((h) => h.perfect).length
  const streak = currentStreak(state.history || [], state.lastActiveDate || today)

  return [
    `Week in review (${start} → ${today}): you finished ${hist.length} day(s) at an average of ${avg}% completion (grade ${avg >= 100 ? 'S' : avg >= 80 ? 'A' : avg >= 60 ? 'B' : avg >= 40 ? 'C' : 'D'}), earning ${xp} XP.`,
    focusTotal > 0
      ? `You focused ${Math.floor(focusTotal / 60)}h ${focusTotal % 60}m across ${focus.size} day(s).`
      : 'No focus sessions were logged this week — try one Pomodoro.',
    `Best day: ${best.date} at ${best.completionPct}%.${perfect ? ` ${perfect} perfect day(s)!` : ''} Current streak: ${streak} day(s).`,
  ].join(' ')
}

function rulesSuggestions(state) {
  const today = todayStr()
  const rates = completionRates(state, addDays(today, -13))
  const suggestions = []

  for (const r of rates) {
    if (r.opportunities < 5 || r.type === 'yesno') continue
    if (r.rate <= 40 && r.target > 1) {
      const target = Math.max(1, Math.round(r.target * 0.75))
      if (target < r.target) {
        suggestions.push({
          name: r.name,
          emoji: r.emoji,
          type: r.type,
          target,
          ...(r.type === 'count' ? { unit: 'times' } : {}),
          reason: `You reached it only ${r.rate}% of days — lower the daily target from ${r.target} to ${target} to rebuild momentum.`,
        })
      }
    } else if (r.rate >= 90) {
      const target = Math.min(999, Math.round(r.target * 1.25))
      if (target > r.target) {
        suggestions.push({
          name: r.name,
          emoji: r.emoji,
          type: r.type,
          target,
          ...(r.type === 'count' ? { unit: 'times' } : {}),
          reason: `You clear this ${r.rate}% of days — raise the target from ${r.target} to ${target} for a real challenge.`,
        })
      }
    }
  }

  const names = new Set((state.tasks || []).map((t) => t.name.toLowerCase()))
  if (!names.has('plan the day')) {
    suggestions.push({
      name: 'Plan the day',
      emoji: '🗓️',
      xp: 10,
      type: 'yesno',
      repeat: 'daily',
      timeOfDay: 'morning',
      reason: 'A 2-minute morning planning habit pairs well with your routine and protects your streak.',
    })
  }

  return suggestions.slice(0, 3)
}

/* ===== public API ===== */

async function generate(userId, kind, { system, prompt, rulesFn }) {
  const cached = await getCached(userId, kind)
  if (cached) return cached

  const state = await getState(userId)
  let payload
  let source = 'rules'

  if (env.geminiApiKey) {
    try {
      const raw = await callGemini(system, prompt(state))
      // insights + suggest-tasks demand JSON; weekly-summary is plain text.
      const wantsJson = rulesFn.name !== 'rulesWeeklySummary'
      const parsed = wantsJson ? extractJson(raw) : null
      if (wantsJson && !parsed) throw new Error('Gemini reply was not parseable JSON')
      payload = parsed || raw
      source = 'gemini'
    } catch (err) {
      console.warn(`[ai] ${kind}: Gemini failed, using rules fallback —`, err.message)
      payload = null
    }
  }

  if (payload === null || payload === undefined) {
    payload = rulesFn(state)
    source = 'rules'
  }

  return setCached(userId, kind, source, payload)
}

/** POST /ai/insights — 2–4 short observations. */
export async function insights(userId) {
  const result = await generate(userId, 'insights', {
    system:
      'You are a friendly habit coach inside DailyQuest. Reply ONLY with JSON: {"insights":["…","…"]}. 2 to 4 items, each one short plain-text observation (max 120 chars), no emoji, no markdown.',
    prompt: (state) =>
      `Here is the player's recent data:\n\n${buildDigest(state)}\n\nGive 2-4 short observations about: patterns in missed tasks, their best days, and streak risk.`,
    rulesFn: rulesInsights,
  })

  let items = Array.isArray(result.payload)
    ? result.payload
    : Array.isArray(result.payload?.insights)
      ? result.payload.insights
      : String(result.payload || '')
          .split('\n')
          .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
          .filter(Boolean)
  items = items.filter((s) => typeof s === 'string' && s.trim()).slice(0, 4)
  if (items.length < 2) items = rulesInsights(await getState(userId))

  return {
    insights: items.slice(0, 4),
    source: result.source,
    cached: Boolean(result.cached),
    generatedAt: new Date().toISOString(),
  }
}

/** GET /ai/weekly-summary — a short written recap. */
export async function weeklySummary(userId) {
  const result = await generate(userId, 'weekly-summary', {
    system:
      'You are a friendly habit coach inside DailyQuest. Write a short, encouraging recap of the player week: 2-3 sentences, plain text only, no lists, no headers, no emoji.',
    prompt: (state) => `Player data:\n\n${buildDigest(state)}\n\nWrite the weekly recap.`,
    rulesFn: rulesWeeklySummary,
  })

  const text =
    typeof result.payload === 'string'
      ? result.payload
      : String(result.payload?.summary || rulesWeeklySummary(await getState(userId)))

  const today = todayStr()
  return {
    summary: text.trim(),
    range: { start: addDays(today, -6), end: today },
    source: result.source,
    cached: Boolean(result.cached),
    generatedAt: new Date().toISOString(),
  }
}

const SUGGESTION_TYPES = ['yesno', 'count', 'timed']

/** POST /ai/suggest-tasks — new tasks / target adjustments. */
export async function suggestTasks(userId) {
  const result = await generate(userId, 'suggest-tasks', {
    system:
      'You are a habit coach inside DailyQuest. Reply ONLY with JSON: {"suggestions":[{"name":"…","emoji":"✨","xp":10,"type":"yesno|count|timed","target":1,"unit":"times","repeat":"daily","reason":"…"}]}. 1-3 suggestions grounded in the data. xp 5-200, target 1-999, name <= 40 chars, reason <= 140 chars. Only include target/unit for count/timed types.',
    prompt: (state) =>
      `Player data:\n\n${buildDigest(state)}\n\nSuggest new tasks or target adjustments based on this history.`,
    rulesFn: rulesSuggestions,
  })

  const raw = Array.isArray(result.payload)
    ? result.payload
    : Array.isArray(result.payload?.suggestions)
      ? result.payload.suggestions
      : []

  // Sanitize: the client/server task rules still apply.
  const suggestions = raw
    .filter((s) => s && typeof s === 'object' && typeof s.name === 'string' && s.name.trim())
    .slice(0, 4)
    .map((s) => {
      const type = SUGGESTION_TYPES.includes(s.type) ? s.type : 'yesno'
      const target =
        type === 'yesno'
          ? undefined
          : Math.min(999, Math.max(1, Math.round(Number(s.target) || 1)))
      return {
        name: String(s.name).trim().slice(0, 40),
        emoji: String(s.emoji || '✨').slice(0, 4),
        xp: Math.min(200, Math.max(5, Math.round(Number(s.xp) || 10))),
        type,
        ...(target ? { target } : {}),
        ...(type === 'count' ? { unit: String(s.unit || 'times').slice(0, 10) } : {}),
        repeat: ['daily', 'weekdays', 'weekends', 'custom', 'once'].includes(s.repeat)
          ? s.repeat
          : 'daily',
        reason: String(s.reason || '').slice(0, 160),
      }
    })

  if (!suggestions.length) {
    const fallback = rulesSuggestions(await getState(userId))
    return { suggestions: fallback, source: 'rules', cached: false, generatedAt: new Date().toISOString() }
  }

  return {
    suggestions,
    source: result.source,
    cached: Boolean(result.cached),
    generatedAt: new Date().toISOString(),
  }
}
