'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import MobileDrawer from './MobileDrawer'
import BadgeWatcher from '../BadgeWatcher'
import BadgeToasts from '../BadgeToasts'
import Confetti from '../ui/Confetti'
import CommandPalette from '../CommandPalette'
import { Toaster } from 'sonner'
import { useQuest } from '../../context/QuestContext'
import useAuth from '../../hooks/useAuth'
import { scheduledTasks } from '../../utils/schedule'
import { isComplete } from '../../utils/tasks'

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { state, markCelebrated } = useQuest()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [confettiKey, setConfettiKey] = useState(null)

  // Celebrate perfect day
  const today = scheduledTasks(state?.tasks || [], state?.lastActiveDate)
  const doneCount = today.filter(isComplete).length
  const allDone = today.length > 0 && doneCount === today.length
  const celebrate = allDone && state?.settings?.celebratedDate !== state?.lastActiveDate

  useEffect(() => {
    if (celebrate && state?.lastActiveDate) {
      setConfettiKey(state.lastActiveDate)
    }
  }, [celebrate, state?.lastActiveDate])

  // 1. If currently on /login, render clean view without sidebar / topbar
  if (pathname === '/login') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
        {children}
        <Toaster
          richColors
          position="top-right"
          theme={state?.settings?.theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    )
  }

  // 2. Loading state: avoid flash of protected content
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl shadow-lg shadow-indigo-500/30 animate-pulse">
            ⚔️
          </div>
          <p className="text-xs font-semibold text-slate-400">Loading DailyQuest...</p>
        </div>
      </div>
    )
  }

  // 3. Not authenticated on protected route: AuthProvider will redirect to /login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl shadow-lg shadow-indigo-500/30 animate-pulse">
            ⚔️
          </div>
          <p className="text-xs font-semibold text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // 4. Authenticated: render full App Shell with persistent sidebar & navigation
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Persistent Left Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64 fixed inset-y-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Persistent Top Bar */}
        <TopBar
          onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Overlays & Watchers */}
      <BadgeWatcher />
      <BadgeToasts />
      <Toaster
        richColors
        position="top-right"
        theme={state?.settings?.theme === 'dark' ? 'dark' : 'light'}
      />
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      {confettiKey && (
        <Confetti
          key={confettiKey}
          onDone={() => {
            setConfettiKey(null)
            markCelebrated(state.lastActiveDate)
          }}
        />
      )}
    </div>
  )
}
