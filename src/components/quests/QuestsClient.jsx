'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle2, Flame, Zap, Clock } from 'lucide-react'
import DayStrip from '../DayStrip'
import TaskList from '../TaskList'
import CompanionSidebar from '../CompanionSidebar'
import PageHeader from '../ui/PageHeader'
import StatCard from '../ui/StatCard'
import { useQuest } from '../../context/QuestContext'
import { useModals } from '../../context/ModalContext'
import useAuth from '../../hooks/useAuth'
import { scheduledTasks } from '../../utils/schedule'
import { isComplete } from '../../utils/tasks'
import { currentStreak } from '../../utils/stats'
import { levelProgress } from '../../utils/xp'

export default function QuestsClient({ initialData, onRequestDeleteTask }) {
  const router = useRouter()
  const { user } = useAuth()
  const { state, focusStart } = useQuest()
  const { openAddQuest, openEditQuest, openReport } = useModals()
  const [selectedDate, setSelectedDate] = useState(null)

  // Metrics for Top KPI row
  const todayTasks = useMemo(
    () => scheduledTasks(state.tasks, state.lastActiveDate),
    [state.tasks, state.lastActiveDate]
  )
  const doneCount = todayTasks.filter(isComplete).length
  const totalCount = todayTasks.length
  const completionPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const allDone = totalCount > 0 && doneCount === totalCount

  const streak = currentStreak(state.history, state.lastActiveDate)
  const { level, current, needed } = levelProgress(state.totalXp)

  const todayFocusMins = useMemo(() => {
    return state.focusSessions
      .filter((f) => f.date === state.lastActiveDate)
      .reduce((s, f) => s + f.minutes, 0)
  }, [state.focusSessions, state.lastActiveDate])

  function handleStartFocus(task) {
    focusStart(task, 'pomodoro')
    router.push('/focus')
  }

  return (
    <div className="space-y-6">
      {/* 1. SaaS Standard PageHeader */}
      <PageHeader
        eyebrow="Workspace / Quests"
        title="Daily Quests"
        description="Track, conquer, and level up your daily habits and active routines."
        badge={allDone ? '🎉 All Complete!' : null}
        action={
          <button
            type="button"
            onClick={openAddQuest}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New Quest</span>
          </button>
        }
      />

      {/* 2. Top-Level SaaS KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Completion"
          value={`${completionPct}%`}
          icon={CheckCircle2}
          subtext={`${doneCount} of ${totalCount} quests done`}
          trend={completionPct === 100 ? 'All Done' : `${totalCount - doneCount} remaining`}
          trendType={completionPct === 100 ? 'positive' : 'neutral'}
        />
        <StatCard
          label="Current Streak"
          value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`}
          icon={Flame}
          color="text-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-950/40"
          subtext="Consecutive days active"
          trend={streak > 0 ? 'Active' : 'Start Today'}
          trendType={streak > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          label="Total XP"
          value={state.totalXp}
          icon={Zap}
          color="text-indigo-600"
          bgColor="bg-indigo-50 dark:bg-indigo-950/40"
          subtext={`Level ${level} • ${current}/${needed} XP`}
          trend={`Lv ${level}`}
          trendType="positive"
        />
        <StatCard
          label="Focus Time Today"
          value={`${todayFocusMins}m`}
          icon={Clock}
          color="text-violet-600"
          bgColor="bg-violet-50 dark:bg-violet-950/40"
          subtext={todayFocusMins > 0 ? 'Deep work logged today' : 'No focus sessions yet'}
          trend={todayFocusMins >= 25 ? 'On Target' : 'Deep Work'}
          trendType={todayFocusMins >= 25 ? 'positive' : 'neutral'}
        />
      </div>

      {/* 3. Main Dashboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Strip + Filtered Task List */}
        <div className="lg:col-span-8 space-y-6">
          <DayStrip
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
          />

          <TaskList
            selectedDate={selectedDate}
            userName={user?.name || 'Adventurer'}
            onNewTask={openAddQuest}
            onEditTask={openEditQuest}
            onFocusTask={handleStartFocus}
            onRequestDeleteTask={onRequestDeleteTask}
          />
        </div>

        {/* Right Column: Companion Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <CompanionSidebar
            onFinishDay={openReport}
            onOpenFocusRoom={() => router.push('/focus')}
            onOpenAchievements={() => router.push('/achievements')}
          />
        </div>
      </div>
    </div>
  )
}
