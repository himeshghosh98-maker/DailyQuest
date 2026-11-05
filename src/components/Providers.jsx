'use client'

import { useEffect, useState } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { QuestProvider } from '../context/QuestContext'
import { FocusProvider } from '../context/FocusContext'
import { ModalProvider } from '../context/ModalContext'

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <AuthProvider>
      <QuestProvider>
        <FocusProvider>
          <ModalProvider>
            {/* Avoid flash of unhydrated state on SSR */}
            <div className={mounted ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'}>
              {children}
            </div>
          </ModalProvider>
        </FocusProvider>
      </QuestProvider>
    </AuthProvider>
  )
}
