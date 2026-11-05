import crypto from 'node:crypto'

/**
 * Central environment config. Values come from process.env (.env is loaded
 * by src/index.js via dotenv). Nothing here is ever sent to the frontend.
 */
const env = {
  // Some shells export PORT=0 — only honor a real, positive port.
  port: Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  jwtSecret: (process.env.JWT_SECRET || '').trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  // Gemini credentials stay server-side only (legacy CLAUDE_* vars unused).
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  aiCacheHours: Number(process.env.AI_CACHE_HOURS || 4),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

export function isProd() {
  return env.nodeEnv === 'production'
}

/**
 * Fail fast in production when secrets are missing; in dev, fall back to a
 * random ephemeral JWT secret (tokens then die on restart — acceptable).
 */
export function ensureSecrets() {
  if (env.jwtSecret && !env.jwtSecret.startsWith('change-me')) return env.jwtSecret
  if (isProd()) {
    throw new Error('JWT_SECRET must be set in production (.env)')
  }
  console.warn('[env] JWT_SECRET missing — using an ephemeral dev secret (tokens reset on restart)')
  env.jwtSecret = crypto.randomBytes(32).toString('hex')
  return env.jwtSecret
}

export default env
