'use client'

import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  User,
  Lock,
  Zap,
  Clock,
  Trophy,
  Sun,
  Moon,
  Loader2,
  Compass,
  CheckCircle2,
  Flame,
  ShieldCheck,
} from 'lucide-react'
import { useQuest } from '../context/QuestContext'

export default function LoginScreen({ onLogin, onGuest }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const { state: questState, setSettings } = useQuest()
  const isDark = questState?.settings?.theme === 'dark'

  function handleThemeToggle() {
    if (setSettings) {
      setSettings({ theme: isDark ? 'light' : 'dark' })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your adventurer name')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await onLogin(name, password)
      if (res && !res.ok) {
        setError(res.error || 'Failed to sign in. Please try again.')
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuest() {
    setError('')
    setGuestLoading(true)
    try {
      await onGuest?.()
    } catch (err) {
      setError(err?.message || 'Could not start guest session')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience: Subtle Indigo/Purple Gradient Mesh & Grid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Glowing Orbs */}
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/10 blur-3xl dark:from-indigo-600/20 dark:to-violet-600/15" />
        <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-gradient-to-bl from-purple-500/15 to-indigo-500/10 blur-3xl dark:from-purple-600/20 dark:to-indigo-600/15" />
        <div className="absolute -bottom-40 left-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-amber-500/10 to-indigo-500/10 blur-3xl dark:from-amber-600/10 dark:to-indigo-900/20" />

        {/* Delicate Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f10a_1px,transparent_1px),linear-gradient(to_bottom,#6366f10a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)]" />
      </div>

      {/* Top Bar Floating Controls */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Mobile-only compact logo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-lg shadow-md shadow-indigo-500/30">
            ⚔️
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            DailyQuest
          </span>
        </div>

        {/* Desktop placeholder spacer */}
        <div className="hidden lg:block" />

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={handleThemeToggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all cursor-pointer"
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Container: Split-screen on Desktop (approx 58/42) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-4 lg:py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center w-full">
          
          {/* ================= LEFT / BRAND SHOWCASE PANEL ================= */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 lg:pr-4">
            
            {/* Logo & Headline */}
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-3">
                <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-3xl sm:text-4xl shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10 transition-transform duration-300 hover:scale-105">
                  ⚔️
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      DailyQuest
                    </span>
                    <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-800/60 dark:text-indigo-300">
                      v2.0
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Gamified Productivity Engine
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Level up your life, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
                  one quest at a time.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Transform daily habits and routine tasks into rewarding adventures. Complete quests, earn XP, maintain streaks, and enter deep focus with an integrated Pomodoro room.
              </p>
            </div>

            {/* Visual Element: Illustrated Quests Dashboard Mockup (Hidden on tiny screens, prominent on tablet/desktop) */}
            <div className="hidden sm:block relative">
              <div className="relative rounded-2xl border border-slate-200/80 bg-white/70 p-5 backdrop-blur-md shadow-xl dark:border-slate-800/80 dark:bg-slate-900/60 space-y-3.5">
                
                {/* Mock Header: Level & Streak Pill */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                      LV 7
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Grandmaster Strategist</span>
                        <span className="badge-pill bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] py-0 px-1.5">
                          🔥 14 Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        850 / 1,000 XP (85%)
                      </div>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-[85%]" />
                  </div>
                </div>

                {/* Mock Quest Item 1 */}
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-through">
                        Morning Deep Work Sprint
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Timed Quest • 45m completed
                      </div>
                    </div>
                  </div>
                  <span className="badge-pill bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold">
                    +35 XP
                  </span>
                </div>

                {/* Mock Quest Item 2 */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-indigo-200/50 dark:border-indigo-800/50">
                      ⏱️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Focus Room Pomodoro
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        In progress • Session 2 of 4
                      </div>
                    </div>
                  </div>
                  <span className="badge-pill bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[11px] font-bold">
                    +25 XP
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Highlight Strip: 3 Clean Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">XP & Levels</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Turn every task into epic progression.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Focus Room</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Pomodoro timer with ambient focus sounds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Trophy size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Trophies</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Unlock rare badges and preserve streaks.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT / LOGIN FORM CARD ================= */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none backdrop-blur-xl transition-all">
              
              {/* Form Title & Subtitle */}
              <div className="text-center sm:text-left space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Welcome Back
                  </h2>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  Enter your credentials to resume your journey.
                </p>
              </div>

              {/* Demo Mode Badge / Pill */}
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                <span>Demo Mode: any passcode works</span>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                
                {/* Adventurer Name Field */}
                <div>
                  <label
                    htmlFor="login-name"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Adventurer Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                      <User size={18} />
                    </div>
                    <input
                      id="login-name"
                      type="text"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:border-indigo-400"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setError('')
                      }}
                      placeholder="e.g. Alex, Budi, Maya..."
                      maxLength={30}
                      autoFocus
                      disabled={loading || guestLoading}
                    />
                  </div>
                </div>

                {/* Passcode Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                      Passcode
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      Any key accepted
                    </span>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                      <Lock size={18} />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:border-indigo-400"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter any passcode"
                      disabled={loading || guestLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300 flex items-center gap-2">
                    <span className="shrink-0 text-base">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading || guestLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Entering DailyQuest...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter DailyQuest</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full dark:border-slate-800" />
                  <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider dark:bg-slate-900 absolute">
                    or continue with
                  </span>
                </div>

                {/* Secondary Action: Guest Button */}
                <button
                  type="button"
                  onClick={handleGuest}
                  disabled={loading || guestLoading}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {guestLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Preparing Guest Session...</span>
                    </>
                  ) : (
                    <>
                      <Compass size={15} className="text-indigo-500 dark:text-indigo-400" />
                      <span>Explore as Guest</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security / Privacy Trust Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Your quest data is stored securely on your device</span>
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        DailyQuest • Master your routines through gamification
      </footer>
    </div>
  )
}
