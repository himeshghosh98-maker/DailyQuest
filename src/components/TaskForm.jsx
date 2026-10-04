'use client'

import { useState } from 'react'
import {
  DAY_LETTERS,
  EMOJI_CHOICES,
  REPEAT_LABELS,
  REPEAT_MODES,
  TARGET_MAX,
  TARGET_MIN,
  TASK_TYPES,
  TIME_OF_DAY,
  TOD_LABELS,
  TYPE_HINTS,
  TYPE_LABELS,
  UNIT_MAX_LEN,
  XP_MAX,
  XP_MIN,
} from '../constants'
import { todayStr } from '../utils/date'
import { Plus, Minus, Sparkles, Check } from 'lucide-react'

export default function TaskForm({ initial, onSubmit, onCancel, submitLabel = 'Save Quest' }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '✨')
  const [xp, setXp] = useState(initial?.xp ?? 10)
  const [type, setType] = useState(initial?.type ?? 'yesno')
  const [target, setTarget] = useState(initial?.target ?? (type === 'timed' ? 30 : 8))
  const [unit, setUnit] = useState(initial?.unit ?? 'times')
  const [repeat, setRepeat] = useState(initial?.repeat ?? 'daily')
  const [days, setDays] = useState(initial?.days ?? [0, 1, 2, 3, 4])
  const [onceDate, setOnceDate] = useState(initial?.onceDate ?? todayStr())
  const [timeOfDay, setTimeOfDay] = useState(initial?.timeOfDay ?? 'any')
  const [error, setError] = useState('')

  function toggleDay(i) {
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please give your quest a name.')
      return
    }
    const targetNum = Math.round(Number(target))
    if (type !== 'yesno' && (!Number.isFinite(targetNum) || targetNum < TARGET_MIN)) {
      setError(type === 'timed' ? 'Target minutes must be at least 1.' : 'Target count must be at least 1.')
      return
    }
    if (type !== 'yesno' && targetNum > TARGET_MAX) {
      setError(`Daily target can be at most ${TARGET_MAX}.`)
      return
    }
    if (repeat === 'custom' && days.length === 0) {
      setError('Please choose at least one day for a custom repeat schedule.')
      return
    }
    const xpNum = Math.round(Number(xp)) || XP_MIN
    onSubmit({
      name: trimmed.slice(0, 40),
      emoji,
      xp: Math.min(XP_MAX, Math.max(XP_MIN, xpNum)),
      type,
      target: type === 'yesno' ? undefined : targetNum,
      unit: type === 'count' ? (unit.trim() || 'times').slice(0, UNIT_MAX_LEN) : undefined,
      repeat,
      days: repeat === 'custom' ? days : undefined,
      onceDate: repeat === 'once' ? onceDate : undefined,
      timeOfDay,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quest Title
        </label>
        <input
          className="input-aesthetic !text-base font-semibold"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          placeholder="e.g. Read 20 pages, Gym workout..."
          maxLength={40}
          autoFocus
        />
      </div>

      {/* Emoji Avatar Picker */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Icon Avatar
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all ${
                emoji === e
                  ? 'scale-110 bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-950/80'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Type Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Type
        </label>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/60">
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                type === t
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {TYPE_HINTS[type]}
        </p>
      </div>

      {/* Target configuration for Count / Timed */}
      {type === 'count' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Daily Target
            </label>
            <input
              type="number"
              className="input-aesthetic"
              value={target}
              min={TARGET_MIN}
              max={TARGET_MAX}
              onChange={(e) => {
                setTarget(e.target.value)
                setError('')
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Unit
            </label>
            <input
              className="input-aesthetic"
              value={unit}
              maxLength={UNIT_MAX_LEN}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="glasses, reps..."
            />
          </div>
        </div>
      )}

      {type === 'timed' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Daily Target (minutes)
          </label>
          <input
            type="number"
            className="input-aesthetic"
            value={target}
            min={TARGET_MIN}
            max={TARGET_MAX}
            onChange={(e) => {
              setTarget(e.target.value)
              setError('')
            }}
          />
        </div>
      )}

      {/* XP Reward Stepper */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            XP Reward
          </label>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            +{xp} XP
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setXp((v) => Math.max(XP_MIN, Number(v) - 5))}
            className="btn-aesthetic-secondary !h-10 !w-10 !p-0"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={XP_MIN}
            max={XP_MAX}
            step={5}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <button
            type="button"
            onClick={() => setXp((v) => Math.min(XP_MAX, Number(v) + 5))}
            className="btn-aesthetic-secondary !h-10 !w-10 !p-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Repeat Schedule */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Repeat Schedule
        </label>
        <div className="flex flex-wrap gap-1.5">
          {REPEAT_MODES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRepeat(r)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                repeat === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {REPEAT_LABELS[r]}
            </button>
          ))}
        </div>

        {repeat === 'custom' && (
          <div className="mt-3 flex justify-between rounded-2xl bg-slate-100 p-2 dark:bg-slate-800/60">
            {DAY_LETTERS.map((letter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black transition-all ${
                  days.includes(i)
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {repeat === 'once' && (
          <input
            type="date"
            className="input-aesthetic mt-3"
            value={onceDate}
            onChange={(e) => setOnceDate(e.target.value)}
          />
        )}
      </div>

      {/* Time of Day */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Time of Day
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OF_DAY.map((tod) => (
            <button
              key={tod}
              type="button"
              onClick={() => setTimeOfDay(tod)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                timeOfDay === tod
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {TOD_LABELS[tod]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          {error}
        </p>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button type="submit" className="btn-aesthetic-primary flex-1">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-aesthetic-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
