'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, Clock, BarChart3, Trophy, Settings } from 'lucide-react'

const TABS = [
  { href: '/quests', label: 'Quests', icon: Zap },
  { href: '/focus', label: 'Focus', icon: Clock },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/achievements', label: 'Badges', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 transition-colors">
      <div className="flex h-16 items-center justify-around px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive =
            pathname === tab.href ||
            (tab.href === '/quests' && (pathname === '/' || pathname === ''))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
