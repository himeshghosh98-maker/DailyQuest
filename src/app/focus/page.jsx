'use client'

import { useRouter } from 'next/navigation'
import FocusRoom from '../../components/FocusRoom'
import { useFocus } from '../../context/FocusContext'

export default function FocusPage() {
  const router = useRouter()
  const focusEngine = useFocus()

  return (
    <FocusRoom
      focusEngine={focusEngine}
      onBackToQuests={() => router.push('/quests')}
    />
  )
}
