'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { apiFetch, getAuthRecord, setAuthRecord } from '../api/client'
import { migrateAndSync } from '../storage'
import { toast } from 'sonner'

export const AuthContext = createContext(null)

const AUTH_COOKIE = 'dailyquest_auth'

function setAuthCookie(loggedIn) {
  if (typeof document === 'undefined') return
  if (loggedIn) {
    document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=2592000; SameSite=Lax`
  } else {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  }
}

export function AuthProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize from storage on mount
  useEffect(() => {
    try {
      const record = getAuthRecord()
      if (record && record.loggedIn) {
        setUser(record)
        setAuthCookie(true)
      } else {
        setUser(null)
        setAuthCookie(false)
      }
    } catch {
      setUser(null)
      setAuthCookie(false)
    } finally {
      setLoading(false)
    }
  }, [])

  /** Name + passcode -> real account (auto-signup on first use). */
  const login = useCallback(
    async (name, password) => {
      if (!name?.trim()) return { ok: false, error: 'Please enter your name.' }
      if (!password) return { ok: false, error: 'Please enter a password.' }

      const credentials = { name: name.trim().slice(0, 30), password }
      try {
        let res
        try {
          res = await apiFetch('/auth/login', { method: 'POST', body: credentials })
        } catch (err) {
          if (err.code === 'USER_NOT_FOUND') {
            res = await apiFetch('/auth/signup', { method: 'POST', body: credentials })
          } else if (err.code === 'NETWORK') {
            return { ok: false, error: 'Could not reach the server. Is the backend running?' }
          } else {
            throw err
          }
        }
        const next = {
          name: res.user.name.slice(0, 30),
          userId: res.user.id,
          token: res.token,
          isGuest: false,
          loggedIn: true,
          loggedInAt: new Date().toISOString(),
        }
        setAuthRecord(next)
        setAuthCookie(true)
        setUser(next)
        toast.success(`Welcome back, ${next.name}!`)
        // Silent one-time migration of pre-upgrade localStorage data + first pull.
        migrateAndSync().catch(() => {})
        router.push('/quests')
        return { ok: true }
      } catch (err) {
        const detail = Array.isArray(err.details) && err.details[0]?.message
        return { ok: false, error: detail || err.message || 'Login failed. Please try again.' }
      }
    },
    [router],
  )

  /** Skip the form entirely — a temporary local-only account. */
  const guestLogin = useCallback(() => {
    const next = {
      name: 'Guest',
      isGuest: true,
      loggedIn: true,
      loggedInAt: new Date().toISOString(),
    }
    setAuthRecord(next)
    setAuthCookie(true)
    setUser(next)
    toast.success('Logged in as Guest adventurer!')
    router.push('/quests')
  }, [router])

  /** Clears the session only — quest data is untouched. */
  const logout = useCallback(() => {
    setAuthRecord(null)
    setAuthCookie(false)
    setUser(null)
    toast.info('Signed out successfully')
    router.replace('/login')
  }, [router])

  // Route guard: check auth whenever user state, loading or pathname changes
  useEffect(() => {
    if (loading) return
    const isLoginPage = pathname === '/login'

    if (!user && !isLoginPage) {
      router.replace('/login')
    } else if (user && isLoginPage) {
      router.replace('/quests')
    }
  }, [user, loading, pathname, router])

  return (
    <AuthContext.Provider value={{ user, loading, login, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
