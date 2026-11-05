import env from '../config/env.js'
import AiCache from '../models/AiCache.js'

/** Read a cached AI response (null when missing/expired). */
export async function getCached(userId, kind) {
  const doc = await AiCache.findOne({ key: `${userId}:${kind}`, expiresAt: { $gt: new Date() } })
  if (!doc) return null
  return { payload: doc.payload, source: doc.source, cached: true }
}

/** Store an AI response for a few hours (overwrites any previous one). */
export async function setCached(userId, kind, source, payload) {
  const expiresAt = new Date(Date.now() + env.aiCacheHours * 3600_000)
  await AiCache.findOneAndUpdate(
    { key: `${userId}:${kind}` },
    { key: `${userId}:${kind}`, user: userId, kind, source, payload, expiresAt },
    { upsert: true, setDefaultsOnInsert: true },
  )
  return { payload, source, cached: false }
}

/** Drop cached responses (used when data resets). */
export async function clearCached(userId) {
  await AiCache.deleteMany({ user: userId })
}
