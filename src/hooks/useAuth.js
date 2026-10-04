import { useState } from 'react'

/**
 * Fake authentication for TESTING ONLY — no backend, any credentials work.
 *
 * The session persists in localStorage under its own key, separate from the
 * quest data (STORAGE_KEY), so logging out never touches tasks/XP/history.
 * Swap the three functions below for a real auth provider later; the UI
 * only depends on `{ user, login, guestLogin, logout }`.
 */
const AUTH_KEY = 'dailyquest:auth'

function readUser() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(AUTH_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && parsed.loggedIn ? parsed : null
  } catch {
    return null
  }
}

function persist(user) {
  if (typeof window === 'undefined') return
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_KEY)
}

export default function useAuth() {
  const [user, setUser] = useState(readUser)

  /** Any name + password combination logs in (test mode). */
  function login(name, password) {
    if (!name.trim()) return { ok: false, error: 'Please enter your name.' }
    if (!password) return { ok: false, error: 'Please enter a password.' }
    const next = {
      name: name.trim().slice(0, 30),
      isGuest: false,
      loggedIn: true,
      loggedInAt: new Date().toISOString(),
    }
    persist(next)
    setUser(next)
    return { ok: true }
  }

  /** Skip the form entirely. */
  function guestLogin() {
    const next = {
      name: 'Guest',
      isGuest: true,
      loggedIn: true,
      loggedInAt: new Date().toISOString(),
    }
    persist(next)
    setUser(next)
  }

  /** Clears the session only — quest data is untouched. */
  function logout() {
    persist(null)
    setUser(null)
  }

  return { user, login, guestLogin, logout }
}
