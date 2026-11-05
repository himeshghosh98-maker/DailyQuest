import asyncHandler from '../utils/asyncHandler.js'
import * as statsService from '../services/stats.service.js'

/** GET /api/v1/stats — XP/levels/streaks/badges/today in UI-expected shapes. */
export const summary = asyncHandler(async (req, res) => {
  res.json(await statsService.summary(req.user.id))
})
