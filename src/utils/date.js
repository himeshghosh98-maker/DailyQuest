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

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Return the YYYY-MM-DD string `delta` days from `dateStr` (delta may be negative). */
export function addDays(dateStr, delta) {
  const dt = parseDateStr(dateStr)
  dt.setDate(dt.getDate() + delta)
  return toDateStr(dt)
}

/** "Sep 19" style label for charts and tooltips. */
export function shortLabel(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/** Long label like "Friday, September 19". */
export function longLabel(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
