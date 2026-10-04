import { useEffect, useMemo } from 'react'

const COLORS = ['#F97316', '#5A2E1E', '#8FA82B', '#E88BC8', '#FDDCC4', '#A0470F']

/**
 * Full-screen confetti burst. Auto-calls onDone after `duration`.
 * Respects prefers-reduced-motion by rendering nothing.
 */
export default function Confetti({ onDone, duration = 3500 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.6,
        size: 7 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.6,
      })),
    [],
  )

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced && onDone) {
      onDone()
      return
    }
    const t = setTimeout(() => onDone && onDone(), duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  return (
    <div
      className="app-fixed pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      data-slot="confetti"
      aria-hidden
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
