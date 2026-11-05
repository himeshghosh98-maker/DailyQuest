import asyncHandler from '../utils/asyncHandler.js'
import * as focusService from '../services/focus.service.js'

/** POST /api/v1/focus/start */
export const start = asyncHandler(async (req, res) => {
  res.status(201).json(await focusService.startSession(req.user.id, req.body))
})

/** POST /api/v1/focus/stop */
export const stop = asyncHandler(async (req, res) => {
  res.json(await focusService.stopSession(req.user.id, req.body || {}))
})

/** GET /api/v1/focus/sessions */
export const list = asyncHandler(async (req, res) => {
  const { limit, date } = req.query
  res.json(await focusService.history(req.user.id, { limit, date }))
})
