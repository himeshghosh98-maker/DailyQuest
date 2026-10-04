'use client'

import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import DayStrip from '../components/DayStrip'
import TaskList from '../components/TaskList'
import CompanionSidebar from '../components/CompanionSidebar'
import FocusRoom from '../components/FocusRoom'
import AnalyticsView from '../components/AnalyticsView'
import AchievementsView from '../components/AchievementsView'
import Modal from '../components/ui/Modal'
import TaskForm from '../components/TaskForm'
import ReportModal from '../components/ReportModal'
import SettingsModal from '../components/SettingsModal'
import BadgeWatcher from '../components/BadgeWatcher'
import BadgeToasts from '../components/BadgeToasts'
import Confetti from '../components/ui/Confetti'
import LoginScreen from '../components/LoginScreen'
import { useQuest } from '../context/QuestContext'
import useAuth from '../hooks/useAuth'
import useFocusEngine from '../hooks/useFocusEngine'
import useReminder from '../hooks/useReminder'
import { scheduledTasks } from '../utils/schedule'
import { isComplete } from '../utils/tasks'
import { todayStr } from '../utils/date'

export default function Home() {
  const { user, login, guestLogin, logout } = useAuth()
  const { state, addTask, updateTask, markCelebrated, focusStart } = useQuest()

  const [activeTab, setActiveTab] = useState('today') // 'today', 'focus', 'analytics', 'badges'
  const [selectedDate, setSelectedDate] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confettiKey, setConfettiKey] = useState(null)

  // Focus Engine
  const focusEngine = useFocusEngine()
  useReminder()

  // Celebrate perfect day
  const today = scheduledTasks(state.tasks, state.lastActiveDate)
  const doneCount = today.filter(isComplete).length
  const allDone = today.length > 0 && doneCount === today.length
  const celebrate = allDone && state.settings.celebratedDate !== state.lastActiveDate

  useEffect(() => {
    if (celebrate) {
      setConfettiKey(state.lastActiveDate)
    }
  }, [celebrate, state.lastActiveDate])

  // If user is not authenticated, show LoginScreen
  if (!user) {
    return <LoginScreen onLogin={login} onGuest={guestLogin} />
  }

  function handleStartFocus(task) {
    focusStart(task, 'pomodoro')
    setActiveTab('focus')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenFocus={() => setActiveTab('focus')}
        user={user}
        onLogout={logout}
        focusEngine={focusEngine}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Daily Quests Hub */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Main Column: Weekly calendar strip + Task List */}
            <div className="lg:col-span-8 space-y-6">
              {/* Day selector */}
              <DayStrip
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedDate(date)}
              />

              {/* Task list with filters & search */}
              <TaskList
                selectedDate={selectedDate}
                userName={user.name}
                onNewTask={() => setAddOpen(true)}
                onEditTask={(task) => setEditingTask(task)}
                onFocusTask={handleStartFocus}
              />
            </div>

            {/* Right Column: Companion Sidebar */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <CompanionSidebar
                onFinishDay={() => setReportOpen(true)}
                onOpenFocusRoom={() => setActiveTab('focus')}
                onOpenAchievements={() => setActiveTab('badges')}
                focusEngine={focusEngine}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Focus Room */}
        {activeTab === 'focus' && (
          <FocusRoom
            focusEngine={focusEngine}
            onBackToQuests={() => setActiveTab('today')}
          />
        )}

        {/* Tab 3: Analytics & Heatmap */}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* Tab 4: Achievements Trophies */}
        {activeTab === 'badges' && <AchievementsView />}
      </main>

      {/* Modals & Overlays */}
      {/* Add New Quest Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} labelledBy="new-quest-modal">
        <h3 id="new-quest-modal" className="text-xl font-black text-slate-900 dark:text-white mb-4">
          Create New Quest
        </h3>
        <TaskForm
          submitLabel="Create Quest"
          onCancel={() => setAddOpen(false)}
          onSubmit={(payload) => {
            addTask(payload)
            setAddOpen(false)
          }}
        />
      </Modal>

      {/* Edit Quest Modal */}
      <Modal open={Boolean(editingTask)} onClose={() => setEditingTask(null)} labelledBy="edit-quest-modal">
        <h3 id="edit-quest-modal" className="text-xl font-black text-slate-900 dark:text-white mb-4">
          Edit Quest
        </h3>
        {editingTask && (
          <TaskForm
            initial={editingTask}
            submitLabel="Update Quest"
            onCancel={() => setEditingTask(null)}
            onSubmit={(payload) => {
              updateTask({ id: editingTask.id, ...payload })
              setEditingTask(null)
            }}
          />
        )}
      </Modal>

      {/* Report Modal */}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={logout} />

      {/* Achievement Toast Stack */}
      <BadgeToasts />

      {/* Confetti Celebration */}
      {confettiKey && (
        <Confetti
          key={confettiKey}
          onDone={() => {
            setConfettiKey(null)
            markCelebrated(state.lastActiveDate)
          }}
        />
      )}

      {/* Automatic badge progress checker */}
      <BadgeWatcher />
    </div>
  )
}
