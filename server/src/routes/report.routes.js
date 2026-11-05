import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate.js'
import * as reportController from '../controllers/report.controller.js'

const router = Router()

/** Strict calendar-date check (rejects 2026-13-99 and friends). */
const isoDate = z.string().refine((s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}, 'Must be a valid date (YYYY-MM-DD).')

router.get(
  '/daily',
  validate({ query: z.object({ date: isoDate.optional() }) }),
  reportController.daily,
)

router.get(
  '/weekly',
  validate({ query: z.object({ end: isoDate.optional() }) }),
  reportController.weekly,
)

router.post('/finish-day', reportController.finishDay)

export default router
