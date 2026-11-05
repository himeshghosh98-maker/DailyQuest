'use client'

import { createContext, useContext, useState } from 'react'
import Modal from '../components/ui/Modal'
import TaskForm from '../components/TaskForm'
import ReportModal from '../components/ReportModal'
import SettingsModal from '../components/SettingsModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useQuest } from './QuestContext'
import useAuth from '../hooks/useAuth'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const { addTask, updateTask } = useQuest()
  const { logout } = useAuth()

  const [addOpen, setAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState(null)

  const openAddQuest = () => setAddOpen(false) || setAddOpen(true)
  const openEditQuest = (task) => setEditingTask(task)
  const openReport = () => setReportOpen(true)
  const openSettings = () => setSettingsOpen(true)

  const confirmAction = ({
    title,
    description,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = true,
  }) => {
    setConfirmConfig({
      title,
      description,
      onConfirm,
      confirmText,
      cancelText,
      danger,
    })
  }

  const closeConfirm = () => setConfirmConfig(null)

  return (
    <ModalContext.Provider
      value={{
        openAddQuest,
        openEditQuest,
        openReport,
        openSettings,
        confirmAction,
      }}
    >
      {children}

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

      {/* Daily Summary Report Modal */}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={logout}
      />

      {/* Global Confirmation Dialog */}
      {confirmConfig && (
        <ConfirmDialog
          open={Boolean(confirmConfig)}
          onClose={closeConfirm}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          danger={confirmConfig.danger}
        />
      )}
    </ModalContext.Provider>
  )
}

export function useModals() {
  const ctx = useContext(ModalContext)
  if (!ctx) {
    throw new Error('useModals must be used within a ModalProvider')
  }
  return ctx
}
