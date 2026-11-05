import mongoose from 'mongoose'

/**
 * Cached AI responses. TTL-deleted a few hours after creation so the same
 * user data isn't re-analyzed on every page load.
 * key = `${userId}:${kind}` (one cache slot per endpoint per user).
 */
const aiCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  kind: { type: String, required: true },
  source: { type: String, enum: ['gemini', 'rules'], required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
})

// MongoDB TTL monitor removes expired docs automatically.
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('AiCache', aiCacheSchema)
