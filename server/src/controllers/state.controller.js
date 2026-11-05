import asyncHandler from '../utils/asyncHandler.js'
import * as stateService from '../services/state.service.js'

/** GET /api/v1/state — the full client-shaped state blob. */
export const get = asyncHandler(async (req, res) => {
  res.json(await stateService.getState(req.user.id))
})

/** PUT /api/v1/state — full replace (offline-cache write sync). */
export const replace = asyncHandler(async (req, res) => {
  res.json(await stateService.replaceState(req.user.id, req.body.state ?? req.body))
})

/**
 * POST /api/v1/state/migrate — one-time localStorage upload.
 * Applies ONLY when the server state is still empty, so a fresh account
 * inherits the browser's existing data exactly once.
 */
export const migrate = asyncHandler(async (req, res) => {
  const incoming = req.body.state ?? req.body
  const doc = await stateService.getStateDoc(req.user.id)

  const isEmpty =
    !doc.migratedAt &&
    (doc.tasks || []).length === 0 &&
    (doc.history || []).length === 0 &&
    (doc.focusSessions || []).length === 0 &&
    !Number(doc.totalXp)

  if (!isEmpty) {
    return res.json({ migrated: false, reason: 'server-has-data', state: stateService.toClientShape(doc) })
  }

  const clean = stateService.sanitizeIncoming(incoming)
  doc.set(clean)
  doc.migratedAt = new Date()
  await doc.save()
  return res.json({ migrated: true, state: stateService.toClientShape(doc) })
})
