import asyncHandler from '../utils/asyncHandler.js'
import * as aiService from '../services/ai.service.js'

/** POST /api/v1/ai/insights */
export const insights = asyncHandler(async (req, res) => {
  res.json(await aiService.insights(req.user.id))
})

/** GET /api/v1/ai/weekly-summary */
export const weeklySummary = asyncHandler(async (req, res) => {
  res.json(await aiService.weeklySummary(req.user.id))
})

/** POST /api/v1/ai/suggest-tasks */
export const suggestTasks = asyncHandler(async (req, res) => {
  res.json(await aiService.suggestTasks(req.user.id))
})
