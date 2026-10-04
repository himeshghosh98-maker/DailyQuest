/** Grade for a completion percentage: S (100) down to D. */
export function gradeFor(pct) {
  if (pct >= 100) return 'S'
  if (pct >= 80) return 'A'
  if (pct >= 60) return 'B'
  if (pct >= 40) return 'C'
  return 'D'
}

/**
 * Display metadata per grade. Class strings are written out literally so
 * Tailwind's scanner can see them. Gradients use the warm palette.
 */
export const GRADE_META = {
  S: {
    title: 'Legendary!',
    gradient: 'from-amber-300 via-orange-400 to-tangerine',
    shadow: 'shadow-amber-400/40',
    message: 'Flawless victory — every single quest crushed. The realm sings your name! 🏆',
  },
  A: {
    title: 'Excellent',
    gradient: 'from-lime-300 to-olive',
    shadow: 'shadow-lime-500/40',
    message: 'Outstanding discipline, hero. Almost perfect! ⚔️',
  },
  B: {
    title: 'Good Work',
    gradient: 'from-yellow-300 to-amber-400',
    shadow: 'shadow-amber-400/40',
    message: 'Solid effort! A few quests slipped away, but you are close to greatness. 🛡️',
  },
  C: {
    title: 'Rough Day',
    gradient: 'from-orange-300 to-ember',
    shadow: 'shadow-orange-500/40',
    message: 'A bumpy day, but every hero stumbles. Tomorrow is a fresh quest log. 🔥',
  },
  D: {
    title: 'Rest Day',
    gradient: 'from-stone-300 to-stone-400',
    shadow: 'shadow-stone-400/30',
    message: 'Even heroes rest. Recommit tomorrow and rise again. 🌅',
  },
}
