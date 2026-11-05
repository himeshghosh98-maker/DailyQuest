'use client'

import { useRef, useState } from 'react'
import Modal from './ui/Modal'
import ConfirmDialog from './ui/ConfirmDialog'
import { useQuest } from '../context/QuestContext'
import { downloadBackup, parseBackup } from '../storage'
import { playChime, requestNotifyPermission } from '../utils/alerts'
import { Sun, Moon, Volume2, Bell, Download, Upload, RotateCcw, LogOut, Check } from 'lucide-react'
import { toast } from 'sonner'
import useAuth from '../hooks/useAuth'

export default function SettingsModal({ open, onClose, onLogout: onLogoutProp }) {
  const { state, setSettings, importData, resetAll } = useQuest()
  const { logout: authLogout } = useAuth()
  const onLogout = onLogoutProp || authLogout
  const fileRef = useRef(null)
  const [confirmConfig, setConfirmConfig] = useState(null)

  const s = state.settings
  const notifSupported = typeof Notification !== 'undefined'

  async function enableNotifications(enabled) {
    if (!enabled) {
      setSettings({ notifEnabled: false })
      toast.info('Daily reminders turned off')
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
      setConfirmConfig({
        title: 'Import Backup File?',
        description: `Import backup with ${next.tasks.length} quests and ${next.history.length} history days? This will replace your current data.`,
        confirmText: 'Import & Replace',
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
    setConfirmConfig({
      title: 'Reset All Progress?',
      description:
        'Are you sure you want to reset all progress? All quests, XP, history, and achievements will be restored to initial defaults.',
      confirmText: 'Reset All Data',
      danger: true,
      onConfirm: () => {
        resetAll()
        toast.info('All progress has been restored to defaults.')
        onClose()
      },
    })
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="settings-title">
      <div className="space-y-6">
        <div>
          <h2 id="settings-title" className="text-xl font-bold text-slate-900 dark:text-white">
            Preferences & Settings
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Customize your app experience, timer presets, and manage your data.
          </p>
        </div>

        {/* Section 1: Appearance & Sounds */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Appearance & Audio
          </h3>

          {/* Theme */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Theme Mode</p>
              <p className="text-xs text-slate-500">Switch between light and dark obsidian theme</p>
            </div>
            <button
              onClick={() => setSettings({ theme: s.theme === 'dark' ? 'light' : 'dark' })}
              className="btn-aesthetic-secondary !py-1.5 !px-3 !text-xs"
            >
              {s.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{s.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>

          {/* Focus Sound */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Timer Sound Chimes</p>
              <p className="text-xs text-slate-500">Play pleasant audio chime when focus/break ends</p>
            </div>
            <button
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
        </div>

        {/* Section 2: Pomodoro Durations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Focus Timer Durations
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Focus (min)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                className="input-aesthetic mt-1 !text-center font-bold"
                value={s.pomodoroFocus ?? 25}
                onChange={(e) => setSettings({ pomodoroFocus: Math.max(1, Number(e.target.value)) })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Short Break
              </label>
              <input
                type="number"
                min={1}
                max={30}
                className="input-aesthetic mt-1 !text-center font-bold"
                value={s.pomodoroBreak ?? 5}
                onChange={(e) => setSettings({ pomodoroBreak: Math.max(1, Number(e.target.value)) })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Long Break
              </label>
              <input
                type="number"
                min={1}
                max={60}
                className="input-aesthetic mt-1 !text-center font-bold"
                value={s.pomodoroLongBreak ?? 15}
                onChange={(e) => setSettings({ pomodoroLongBreak: Math.max(1, Number(e.target.value)) })}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Management */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Data & Backup
          </h3>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadBackup(state)}
              className="btn-aesthetic-secondary flex-1 !text-xs !py-2.5"
            >
              <Download size={14} />
              <span>Export Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-aesthetic-secondary flex-1 !text-xs !py-2.5"
            >
              <Upload size={14} />
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

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600"
            >
              Reset All Progress to Default
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onLogout()
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmConfig && (
        <ConfirmDialog
          open={Boolean(confirmConfig)}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmText={confirmConfig.confirmText}
          danger={confirmConfig.danger}
        />
      )}
    </Modal>
  )
}
