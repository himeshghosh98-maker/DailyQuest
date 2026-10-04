import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: 'DailyQuest — Gamified Habit & Productivity Tracker',
  description: 'Level up your daily habits, stay focused with Pomodoro, and achieve your goals with DailyQuest.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-[#090d16] font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
