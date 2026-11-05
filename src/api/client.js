/**
 * The single API client for DailyQuest.
 *
 * Base URL comes from env: VITE_API_URL (Vite) or NEXT_PUBLIC_API_URL (Next).
 * Every wrapper keeps localStorage semantics in mind: calls reject with an
 * ApiError-shaped object so callers can distinguish offline (code NETWORK)
 * from real server errors.
 */

const fromVite =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined
const fromNext =
  typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_API_URL : undefined

export const API_BASE_URL = (fromVite || fromNext || 'http://localhost:4000/api/v1').replace(
  /\/+$/,
  '',
)

const AUTH_KEY = 'dailyquest:auth'

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code || 'ERROR'
    this.details = details
  }
}

/* ===== Auth record (same localStorage key the app already used) ===== */

export function getAuthRecord() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(AUTH_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && parsed.loggedIn ? parsed : null
  } catch {
    return null
  }
}

export function setAuthRecord(record) {
  try {
    if (typeof window === 'undefined') return
    if (record) localStorage.setItem(AUTH_KEY, JSON.stringify(record))
    else localStorage.removeItem(AUTH_KEY)
  } catch {
    /* storage full/blocked — ignore */
  }
}

export function getToken() {
  const rec = getAuthRecord()
  return rec && rec.token && !rec.isGuest ? rec.token : null
}

export function isOnlineSession() {
  return Boolean(getToken())
}

/* ===== fetch wrapper ===== */

export async function apiFetch(path, { method = 'GET', body, auth = true, timeoutMs = 15000 } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch {
    if (timer) clearTimeout(timer)
    throw new ApiError('Could not reach the DailyQuest server.', 0, 'NETWORK')
  }
  if (timer) clearTimeout(timer)

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new ApiError(
      (data && data.message) || `Request failed (${res.status})`,
      res.status,
      (data && data.code) || 'ERROR',
      data && data.details,
    )
  }
  return data
}
