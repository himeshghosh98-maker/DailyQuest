/** Format a Date as a local YYYY-MM-DD string. */
export function toDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr() {
  return toDateStr(new Date())
}

function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** YYYY-MM-DD string `delta` days from `dateStr` (may be negative). */
export function addDays(dateStr, delta) {
  const dt = parseDateStr(dateStr)
  dt.setDate(dt.getDate() + delta)
  return toDateStr(dt)
}

/** "Sep 19" style label. */
export function shortLabel(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Monday-first day index (0 = Mon … 6 = Sun). */
export function dayIndexOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

/** ISO week start (Monday) for a YYYY-MM-DD date string. */
export function weekStart(dateStr) {
  return addDays(dateStr, -dayIndexOf(dateStr))
}
