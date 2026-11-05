'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Sparkles,
  Sun,
  Moon,
  Menu,
  Settings as SettingsIcon,
  Clock,
  User,
  LogOut,
  Bell,
  Command,
} from 'lucide-react'
import { useQuest } from '../../context/QuestContext'
import { useFocus } from '../../context/FocusContext'
import { useModals } from '../../context/ModalContext'
import useAuth from '../../hooks/useAuth'
import { levelProgress } from '../../utils/xp'
import { currentStreak } from '../../utils/stats'
import { fmtClock } from '../../utils/focus'

export default function TopBar({ onOpenMobileMenu, onOpenCommandPalette }) {
  const { state, setSettings } = useQuest()
  const { openSettings } = useModals()
  const { user, logout } = useAuth()
  const focusEngine = useFocus()
  const [profileOpen, setProfileOpen] = useState(false)

  const isDark = state.settings.theme === 'dark'
  const { level, current, needed, pct } = levelProgress(state.totalXp)
  const streak = currentStreak(state.history, state.lastActiveDate)

  const focusSession = focusEngine?.session
  const focusRunning = focusEngine?.running
  const focusRemaining = focusEngine?.remaining

  function toggleTheme() {
    setSettings({ theme: isDark ? 'light' : 'dark' })
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open mobile menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu size={18} />
          </button>

          {/* Mobile brand badge */}
          <Link href="/quests" className="flex items-center gap-2 lg:hidden outline-none">
            <span className="text-xl">⚔️</span>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              DailyQuest
            </span>
          </Link>
        </div>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Focus Session Quick Indicator */}
          {focusSession && (
            <Link
              href="/focus"
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                focusRunning
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
              title="Click to view Focus Session"
            >
              <span>{focusRunning ? '⏳' : '⏸️'}</span>
              <span className="font-mono">{fmtClock(focusRemaining)}</span>
              <span className="max-w-[80px] truncate hidden md:inline">
                ({focusSession.taskName})
              </span>
            </Link>
          )}

          {/* Quick Command Palette Button */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Quick Command Palette (Ctrl+K or ⌘K)"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
            >
              <Command size={13} />
              <span className="text-[11px]">Search...</span>
              <kbd className="rounded bg-white px-1.5 py-0.2 text-[10px] font-bold text-slate-400 shadow-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Streak Badge */}
          <div
            className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30"
            title={`${streak} Day Streak!`}
          >
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>{streak}d</span>
          </div>

          {/* Level & XP Mini Card */}
          <div
            className="hidden sm:flex items-center gap-2.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 ring-1 ring-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-500/30"
            title={`${state.totalXp} Total XP (${needed - current} XP to Lv ${level + 1})`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-black text-white shrink-0">
              {level}
            </div>
            <div className="w-16">
              <div className="flex justify-between text-[10px] leading-tight text-indigo-700 dark:text-indigo-300">
                <span>Lv {level}</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-900">
                <div
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-500"
                  style={{ width: `${Math.max(pct, 5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Settings Quick Link */}
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <SettingsIcon size={17} />
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl p-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-200 to-orange-300 text-sm shadow-inner">
                {user?.isGuest ? '👤' : '🐯'}
              </span>
              <span className="hidden xl:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                {user?.name || 'Adventurer'}
              </span>
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || 'Adventurer'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user?.isGuest ? 'Guest Session' : 'Logged In User'}
                    </p>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <SettingsIcon size={14} />
                      <span>Settings & Data</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
