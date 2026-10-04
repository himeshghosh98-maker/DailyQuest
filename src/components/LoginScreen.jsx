'use client'

import { useState } from 'react'
import { Eye, EyeOff, Sparkles, ShieldCheck, Flame, ArrowRight, User } from 'lucide-react'

export default function LoginScreen({ onLogin, onGuest }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const res = onLogin(name, password)
    if (res && !res.ok) setError(res.error)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background glow meshes */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[480px] w-[480px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse-subtle" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Card */}
        <div className="card-aesthetic p-6 sm:p-8 shadow-xl">
          {/* Logo & Headline */}
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-3xl shadow-lg shadow-indigo-500/30">
              ⚔️
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              DailyQuest
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Level up your routines, build unbreakable streaks, and conquer your goals.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="login-name"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Adventurer Name
              </label>
              <input
                id="login-name"
                className="input-aesthetic !text-sm"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="e.g. Alex, Budi, Maya..."
                maxLength={30}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Passcode
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-aesthetic !text-sm !pr-10"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter any passcode"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-center">
                {error}
              </p>
            )}

            <button type="submit" className="btn-aesthetic-primary w-full !py-3">
              <span>Enter DailyQuest</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full dark:border-slate-800" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider dark:bg-slate-900 absolute">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={onGuest}
              className="btn-aesthetic-secondary w-full !py-2.5 !text-xs"
            >
              <User size={14} />
              <span>Explore as Guest</span>
            </button>
          </form>

          {/* Highlights */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <span className="text-sm">⚡</span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">XP & Levels</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm">⏱️</span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">Pomodoro</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm">🏆</span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">Trophies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
