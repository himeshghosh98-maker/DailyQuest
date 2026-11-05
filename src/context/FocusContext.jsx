'use client'

import { createContext, useContext } from 'react'
import useFocusEngine from '../hooks/useFocusEngine'
import useReminder from '../hooks/useReminder'

const FocusContext = createContext(null)

export function FocusProvider({ children }) {
  const engine = useFocusEngine()
  useReminder()

  return <FocusContext.Provider value={engine}>{children}</FocusContext.Provider>
}

export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider')
  }
  return context
}
