/**
 * Focus alerts: a soft WebAudio chime (no asset files), device vibration,
 * browser notifications, and a Screen Wake Lock handle.
 */

let audioCtx = null

function ctx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

/** Play a soft two-tone chime. `up=false` plays a descending (rest) motif. */
export function playChime(volume = 0.6, up = true) {
  try {
    const ac = ctx()
    if (!ac) return
    const vol = Math.min(1, Math.max(0, Number(volume) || 0))
    if (vol === 0) return
    const notes = up ? [523.25, 783.99] : [659.25, 523.25]
    const t0 = ac.currentTime
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = t0 + i * 0.18
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(vol * 0.35, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)
      osc.connect(gain).connect(ac.destination)
      osc.start(start)
      osc.stop(start + 0.6)
    })
  } catch {
    /* audio unavailable — stay silent */
  }
}

/** Vibrate a short pattern where supported. */
export function vibrate() {
  try {
    navigator.vibrate?.([120, 60, 120])
  } catch {
    /* not supported */
  }
}

/** Fire a focus notification when the user has granted permission. */
export function notifyFocus(title, body) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification(title, { body, silent: true })
  } catch {
    /* notifications unavailable */
  }
}

/** Ask for notification permission on demand (returns the permission). */
export async function requestNotifyPermission() {
  try {
    if (typeof Notification === 'undefined') return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/**
 * Screen Wake Lock: `request()` returns a release() handle or null.
 * Re-acquiring after tab visibility changes is handled by the caller.
 */
export function requestWakeLock() {
  try {
    if (navigator.wakeLock?.request) {
      return navigator.wakeLock.request('screen').catch(() => null)
    }
  } catch {
    /* not supported */
  }
  return Promise.resolve(null)
}
