'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Zap,
  Clock,
  BarChart3,
  Trophy,
  Settings,
  Plus,
  Play,
  Sun,
  Moon,
  Calendar,
  Search,
  CheckCircle2,
  Download,
} from 'lucide-react'
import { useQuest } from '../context/QuestContext'
import { useModals } from '../context/ModalContext'
import { downloadBackup } from '../storage'
import { toast } from 'sonner'

export default function CommandPalette({ open, onOpenChange }) {
  const router = useRouter()
  const { state, setSettings, focusStart } = useQuest()
  const { openAddQuest, openReport } = useModals()

  const isDark = state.settings.theme === 'dark'

  // Keyboard shortcut listener (⌘K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  function navigate(href) {
    onOpenChange(false)
    router.push(href)
  }

  function handleCreateQuest() {
    onOpenChange(false)
    openAddQuest()
  }

  function handleStartFocus() {
    onOpenChange(false)
    const task = state.tasks.find((t) => t.type === 'timed') || state.tasks[0] || {
      id: 'focus-general',
      name: 'General Deep Work',
      emoji: '🧠',
    }
    focusStart(task, 'pomodoro')
    toast.success('Focus session started!')
    router.push('/focus')
  }

  function handleToggleTheme() {
    onOpenChange(false)
    const next = isDark ? 'light' : 'dark'
    setSettings({ theme: next })
    toast.success(`Theme set to ${next === 'dark' ? 'Dark Mode' : 'Light Mode'}`)
  }

  function handleDownloadBackup() {
    onOpenChange(false)
    downloadBackup(state)
    toast.success('Backup JSON downloaded')
  }

  function handleOpenDailyReport() {
    onOpenChange(false)
    openReport()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        <Command label="Command Menu" className="w-full">
          {/* Search Input */}
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search quests..."
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            <kbd className="hidden sm:inline rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-none space-y-2">
            <Command.Empty className="p-6 text-center text-xs text-slate-400">
              No results found.
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group
              heading="Navigation"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1"
            >
              <Command.Item
                onSelect={() => navigate('/quests')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-indigo-500" />
                <span>Go to Daily Quests</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/focus')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Clock className="h-4 w-4 text-indigo-500" />
                <span>Go to Focus Room</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/analytics')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <span>Go to Analytics & History</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/achievements')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Go to Achievements</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigate('/settings')}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Go to Settings</span>
              </Command.Item>
            </Command.Group>

            {/* Quick Actions Group */}
            <Command.Group
              heading="Actions"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1"
            >
              <Command.Item
                onSelect={handleCreateQuest}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-indigo-600" />
                <span>Create New Quest</span>
              </Command.Item>

              <Command.Item
                onSelect={handleStartFocus}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Play className="h-4 w-4 text-emerald-500" />
                <span>Start 25m Pomodoro Focus</span>
              </Command.Item>

              <Command.Item
                onSelect={handleOpenDailyReport}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-amber-500" />
                <span>Open Daily Review Report</span>
              </Command.Item>

              <Command.Item
                onSelect={handleToggleTheme}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-400" />
                )}
                <span>Toggle Theme Mode</span>
              </Command.Item>

              <Command.Item
                onSelect={handleDownloadBackup}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-400" />
                <span>Export Backup Data</span>
              </Command.Item>
            </Command.Group>

            {/* Quests Group */}
            {state.tasks.length > 0 && (
              <Command.Group
                heading="Today's Quests"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1"
              >
                {state.tasks.map((task) => (
                  <Command.Item
                    key={task.id}
                    value={task.name}
                    onSelect={() => {
                      onOpenChange(false)
                      router.push('/quests')
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{task.emoji}</span>
                      <span className={task.done ? 'line-through opacity-60' : ''}>
                        {task.name}
                      </span>
                    </div>
                    <span className="badge-pill bg-amber-50 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      +{task.xp} XP
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer help */}
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between dark:border-slate-800">
            <span>Navigate with arrows, press Enter to select</span>
            <span>ESC to close</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
