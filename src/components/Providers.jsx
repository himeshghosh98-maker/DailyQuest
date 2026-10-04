'use client'

import { useEffect, useState } from 'react'
import { QuestProvider } from '../context/QuestContext'

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <QuestProvider>
      {/* Avoid flash of unhydrated state on SSR */}
      <div className={mounted ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'}>
        {children}
      </div>
    </QuestProvider>
  )
}
