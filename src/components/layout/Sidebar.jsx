'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Clock, BarChart3, Trophy, Settings, Plus, Flame, LogOut, Sparkles } from 'lucide-react'
import { useQuest } from '../../context/QuestContext'
import { useModals } from '../../context/ModalContext'
import useAuth from '../../hooks/useAuth'
import { levelProgress } from '../../utils/xp'
import { currentStreak } from '../../utils/stats'

export const NAV_SECTIONS = [
  {
    title: 'Track',
    items: [
      { href: '/quests', label: 'Quests', icon: Zap },
      { href: '/focus', label: 'Focus Room', icon: Clock },
    ],
  },
  {
    title: 'Review',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/achievements', label: 'Achievements', icon: Trophy },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Backward compatibility export
export const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items)

export default function Sidebar({ onCloseMobile }) {
  const pathname = usePathname()
  const { state } = useQuest()
  const { openAddQuest } = useModals()
  const { user, logout } = useAuth()

  const { level, current, needed, pct } = levelProgress(state.totalXp)
  const streak = currentStreak(state.history, state.lastActiveDate)

  return (
    <aside className="flex flex-col h-full w-64 bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <Link
          href="/quests"
          onClick={onCloseMobile}
          className="group flex items-center gap-3 outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-xl shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
            ⚔️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                DailyQuest
              </span>
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                v2.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Gamified Habit Mastery
            </p>
          </div>
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile()
            openAddQuest()
          }}
          className="w-full btn-aesthetic-primary !py-2.5 !text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Quest</span>
        </button>
      </div>

      {/* Nav Links Grouped By Section */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href === '/quests' && (pathname === '/' || pathname === ''))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Pinned Bottom User & Stats Card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        {/* User Profile Info */}
        <div className="rounded-xl bg-white p-3 border border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-200 to-orange-300 text-sm shadow-inner">
                {user?.isGuest ? '👤' : '🐯'}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Adventurer'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.isGuest ? 'Guest Session' : 'Hero Account'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Quick Stats: Streak & Level */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-950/40">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-200">
                {streak}d Streak
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 dark:bg-indigo-950/40">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] font-black text-indigo-800 dark:text-indigo-200">
                Lv {level}
              </span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>XP Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${Math.max(pct, 5)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
