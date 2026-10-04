import { useEffect, useState } from 'react'
import { Plus, Settings as SettingsIcon } from 'lucide-react'
import { QuestProvider, useQuest } from './context/QuestContext'
import TopBar from './components/TopBar'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import DayStrip from './components/DayStrip'
import ReminderCard from './components/ReminderCard'
import ReportModal from './components/ReportModal'
import BadgeWatcher from './components/BadgeWatcher'
import BadgeToasts from './components/BadgeToasts'
import BadgesStrip from './components/BadgesStrip'
import ProgressView from './components/ProgressView'
import SettingsModal from './components/SettingsModal'
import Modal from './components/ui/Modal'
import Confetti from './components/ui/Confetti'
import PhoneFrame from './components/ui/PhoneFrame'
import LoginScreen from './components/LoginScreen'
import FocusView from './components/FocusView'
import MiniTimer from './components/MiniTimer'
import useFocusEngine from './hooks/useFocusEngine'
import useReminder from './hooks/useReminder'
import useAuth from './hooks/useAuth'
import { todayStr, longLabel } from './utils/date'
import { scheduledTasks } from './utils/schedule'
import { grantedXp, isComplete } from './utils/tasks'
import { USER_AVATAR } from './constants'

const TABS = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'progress', label: 'Progress', icon: '📊' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 18) return 'Afternoon'
  return 'Evening'
}

/**
 * Floating dark-brown "+" button. Anchored to the app root (which fills the
 * phone screen or the viewport in full-screen mode) — never position:fixed.
 */
function Fab({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add a routine"
      data-slot="fab"
      className="app-fixed absolute bottom-24 right-5 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-cocoa text-white shadow-xl shadow-cocoa/40 transition-transform active:scale-90"
    >
      <Plus size={26} strokeWidth={2.5} aria-hidden />
    </button>
  )
}

function GameScreen({ userName, onLogout }) {
  const { state, markCelebrated, addTask, focusStart } = useQuest()
  const [tab, setTab] = useState('today')
  const [reportOpen, setReportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [confettiKey, setConfettiKey] = useState(null)
  const [focusTaskId, setFocusTaskId] = useState(null)

  // Focus engine: live ticking, alerts, wake lock, document title.
  const focus = useFocusEngine()

  useReminder()

  // Poll the clock so quests reset right at midnight without a reload.
  const [, setClock] = useState(todayStr())
  useEffect(() => {
    const t = setInterval(() => setClock(todayStr()), 30_000)
    return () => clearInterval(t)
  }, [])

  const today = scheduledTasks(state.tasks, state.lastActiveDate)
  const doneCount = today.filter(isComplete).length
  const allDone = today.length > 0 && doneCount === today.length
  const celebrate = allDone && state.settings.celebratedDate !== state.lastActiveDate

  // Fire confetti once per perfect day.
  useEffect(() => {
    if (celebrate) setConfettiKey(state.lastActiveDate)
  }, [celebrate, state.lastActiveDate])

  return (
    <div className="app-root flex flex-col overflow-hidden bg-cream text-ink dark:bg-espresso dark:text-parchment">
      {/* The only scrolling region: flex-1, hidden scrollbar (see index.css). */}
      <main className="phone-scroll mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-4" style={{ minHeight: 0 }}>
        {/*
         * Entrance animation lives on this inner wrapper: a transform here
         * must NOT sit on .app-root, or it would become the containing block
         * for the absolute overlays (modals would stop below the status bar).
         */}
        <div className="animate-rise">
        {tab === 'today' ? (
          <>
            {/* Greeting header */}
            <header className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-charcoal dark:text-parchment">
                  {greeting()}, {userName}
                </h1>
                <p className="mt-0.5 text-[13px] font-medium text-ink-soft">
                  {longLabel(todayStr())}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  className="icon-btn"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Open settings"
                >
                  <SettingsIcon size={21} aria-hidden />
                </button>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-peach text-2xl shadow-inner"
                  aria-label="Profile"
                >
                  {userName === 'Guest' ? '👤' : USER_AVATAR}
                </span>
              </div>
            </header>

            {/* Week strip */}
            <div className="mt-4">
              <DayStrip />
            </div>

            {/* Compact level / XP card */}
            <div className="mt-4">
              <TopBar />
            </div>

            {/* Reminder banner */}
            <div className="mt-4">
              <ReminderCard onSet={() => setSettingsOpen(true)} />
            </div>

            {/* Daily routine */}
            <div className="mt-5">
              <TaskList onFocusTask={(task) => {
                focusStart(task, 'pomodoro')
                focus.setOpen(true)
              }} />
            </div>

            <BadgesStrip />
            <button
              className="btn btn-accent mt-5 w-full py-3.5 text-lg"
              onClick={() => setReportOpen(true)}
              disabled={today.length === 0}
            >
              {today.length === 0
                ? 'Nothing scheduled today'
                : allDone
                  ? '🎉 Finish Day'
                  : 'Finish Day'}
            </button>
            <p className="mt-3 text-center text-[13px] font-medium text-ink-soft">
              Quests reset automatically at midnight
            </p>
          </>
        ) : (
          <div className="mt-2">
            <ProgressView />
          </div>
        )}
        </div>
      </main>

      {/* Tab bar: in flow at the bottom (flex-shrink 0), never fixed. */}
      <nav
        className="z-30 flex shrink-0 justify-center gap-2 border-t border-linen/80 bg-white/95 pb-[max(env(safe-area-inset-bottom),20px)] pt-2 backdrop-blur dark:border-white/10 dark:bg-bark/95"
        data-slot="tabbar"
        aria-label="Sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`btn !min-h-0 h-12 !px-5 text-[13px] ${
              tab === t.id ? 'bg-charcoal text-white' : 'btn-ghost'
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            <span className="tab-label hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </nav>

      {tab === 'today' && <Fab onClick={() => setAddOpen(true)} />}

      {/* Mini timer pill while a focus session runs/pauses */}
      <MiniTimer
        session={focus.session}
        remaining={focus.remaining}
        hidden={focus.open}
        onOpen={() => focus.setOpen(true)}
      />

      {/* Full-screen focus view (inside the phone) */}
      <FocusView engine={focus} />

      {/* Add-routine modal, opened from the floating "+" button */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} labelledBy="add-title">
        <h3 id="add-title" className="mb-4 text-lg font-extrabold text-charcoal dark:text-parchment">
          New routine
        </h3>
        <TaskForm
          submitLabel="Add routine"
          onCancel={() => setAddOpen(false)}
          onSubmit={(payload) => {
            addTask(payload)
            setAddOpen(false)
          }}
        />
      </Modal>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={onLogout} />
      <BadgeToasts />

      {confettiKey && (
        <Confetti
          key={confettiKey}
          onDone={() => {
            setConfettiKey(null)
            markCelebrated(state.lastActiveDate)
          }}
        />
      )}

      <BadgeWatcher />
    </div>
  )
}

export default function App() {
  const { user, login, guestLogin, logout } = useAuth()

  return (
    <QuestProvider>
      <PhoneFrame>
        {user ? (
          <GameScreen key={user.name} userName={user.name} onLogout={logout} />
        ) : (
          <LoginScreen onLogin={login} onGuest={guestLogin} />
        )}
      </PhoneFrame>
    </QuestProvider>
  )
}
