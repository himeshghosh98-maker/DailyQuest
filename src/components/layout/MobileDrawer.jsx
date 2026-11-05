'use client'

import { useEffect } from 'react'
import Sidebar from './Sidebar'
import { X } from 'lucide-react'

export default function MobileDrawer({ open, onClose }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform animate-in slide-in-from-left duration-200">
        <div className="relative h-full">
          <Sidebar onCloseMobile={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar drawer"
            className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
