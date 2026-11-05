import asyncHandler from '../utils/asyncHandler.js'
import * as reportService from '../services/report.service.js'

/** GET /api/v1/reports/daily?date=YYYY-MM-DD */
export const daily = asyncHandler(async (req, res) => {
  res.json(await reportService.dailyReport(req.user.id, req.query.date))
})

/** GET /api/v1/reports/weekly?end=YYYY-MM-DD */
export const weekly = asyncHandler(async (req, res) => {
  res.json(await reportService.weeklyReport(req.user.id, req.query.end))
})

/** POST /api/v1/reports/finish-day */
export const finishDay = asyncHandler(async (req, res) => {
  res.json(await reportService.finishDay(req.user.id))
})
