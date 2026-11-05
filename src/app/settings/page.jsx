'use client'

import { useRef, useState } from 'react'
import {
  Sun,
  Moon,
  Volume2,
  Bell,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  User,
  Shield,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react'
import { useQuest } from '../../context/QuestContext'
import useAuth from '../../hooks/useAuth'
import { downloadBackup, parseBackup } from '../../storage'
import { playChime } from '../../utils/alerts'
import PageHeader from '../../components/ui/PageHeader'

import { useModals } from '../../context/ModalContext'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { state, setSettings, importData, resetAll } = useQuest()
  const { user, logout } = useAuth()
  const { confirmAction } = useModals()
  const fileRef = useRef(null)

  const s = state.settings
  const notifSupported = typeof Notification !== 'undefined'

  async function enableNotifications(enabled) {
    if (!enabled) {
      setSettings({ notifEnabled: false })
      toast.info('Daily reminders turned off.')
      return
    }
    if (!notifSupported) {
      toast.error('Notifications are not supported in this browser.')
      return
    }
    const perm =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
    if (perm === 'granted') {
      setSettings({ notifEnabled: true })
      toast.success('Daily reminders enabled!')
    } else {
      toast.error('Notification permission was denied.')
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const next = parseBackup(text)
      confirmAction({
        title: 'Import Backup File?',
        description: `Import backup with ${next.tasks.length} quests and ${next.history.length} history days? This will replace your current data.`,
        confirmText: 'Import & Replace Data',
        danger: true,
        onConfirm: () => {
          importData(next)
          toast.success('Backup imported successfully!')
        },
      })
    } catch (err) {
      toast.error(err?.message || 'Failed to import backup file.')
    }
  }

  function handleReset() {
    confirmAction({
      title: 'Reset All Progress?',
      description:
        'Are you sure you want to reset all progress? All quests, XP, history, and achievements will be restored to initial defaults.',
      confirmText: 'Reset All Data',
      danger: true,
      onConfirm: () => {
        resetAll()
        toast.info('All progress has been restored to defaults.')
      },
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Account / Settings"
        title="Settings & Preferences"
        description="Manage your hero profile, focus parameters, audio cues, and account backups."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/20">
            <Check className="h-3 w-3" />
            <span>Preferences Auto-Saved</span>
          </span>
        }
      />

      {/* 1. Hero Profile Card */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Profile & Identity
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-xs dark:bg-amber-950/50">
            {user?.isGuest ? '👤' : '🐯'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {user?.name || 'Adventurer'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.isGuest
                ? 'Guest Session • Stored in browser local storage'
                : 'Hero Account • Synchronized with Cloud Database'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* 2. Appearance & Theme */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Appearance & Sound
        </h2>

        {/* Theme mode */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Interface Theme
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your visual mode (Obsidian Dark or Clean Light)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ theme: s.theme === 'dark' ? 'light' : 'dark' })}
            className="btn-aesthetic-secondary !py-2 !px-3.5 !text-xs font-bold"
          >
            {s.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{s.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        {/* Sound Chimes */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Audio Chimes
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Play crisp victory chimes upon focus session completion
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !s.focusSound
              setSettings({ focusSound: next })
              if (next) playChime(s.focusVolume ?? 0.6, true)
            }}
            className={`rounded-full p-1 w-11 h-6 transition-colors ${
              s.focusSound !== false ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white h-4 w-4 rounded-full shadow-sm transition-transform ${
                s.focusSound !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 3. Focus Chamber Parameters */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Focus Timer Durations
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Focus Work (min)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              className="input-aesthetic mt-1.5 !text-center font-bold"
              value={s.pomodoroFocus ?? 25}
              onChange={(e) =>
                setSettings({ pomodoroFocus: Math.max(1, Number(e.target.value)) })
              }
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Short Break (min)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              className="input-aesthetic mt-1.5 !text-center font-bold"
              value={s.pomodoroBreak ?? 5}
              onChange={(e) =>
                setSettings({ pomodoroBreak: Math.max(1, Number(e.target.value)) })
              }
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Long Break (min)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              className="input-aesthetic mt-1.5 !text-center font-bold"
              value={s.pomodoroLongBreak ?? 15}
              onChange={(e) =>
                setSettings({ pomodoroLongBreak: Math.max(1, Number(e.target.value)) })
              }
            />
          </div>
        </div>
      </section>

      {/* 4. Data Backup & Export */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Data Management & Backup
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export your entire quest history, XP records, and badges as a JSON file, or restore from a previous backup.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              downloadBackup(state)
              toast.success('Backup JSON downloaded successfully!')
            }}
            className="btn-aesthetic-secondary flex-1 !text-xs !py-3 cursor-pointer"
          >
            <Download size={15} />
            <span>Export Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-aesthetic-secondary flex-1 !text-xs !py-3 cursor-pointer"
          >
            <Upload size={15} />
            <span>Import Backup JSON</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </section>

      {/* 5. Danger Zone */}
      <section className="rounded-xl border border-rose-200 bg-white p-6 dark:border-rose-900/50 dark:bg-slate-900/90 space-y-3 shadow-xs">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
          Danger Zone
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Reset All Progress
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reset quests, total XP, streaks, and achievements back to initial start state.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 transition cursor-pointer shrink-0"
          >
            <RotateCcw size={14} />
            <span>Reset All Data</span>
          </button>
        </div>
      </section>
    </div>
  )
}
