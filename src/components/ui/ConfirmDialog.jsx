'use client'

import Modal from './Modal'
import { AlertTriangle, Trash2 } from 'lucide-react'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="confirm-dialog-title">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              danger
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
            }`}
          >
            {danger ? <AlertTriangle className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-aesthetic-secondary !py-2 !px-4 !text-xs font-semibold"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
