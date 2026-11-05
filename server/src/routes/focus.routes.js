import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate.js'
import * as focusController from '../controllers/focus.controller.js'

const router = Router()

const startBody = z.object({
  task: z.object({
    id: z.string().min(1),
    name: z.string().max(80).optional(),
    emoji: z.string().max(8).optional(),
  }),
  mode: z.enum(['pomodoro', 'custom', 'stopwatch']).optional(),
  customMin: z.number().int().min(1).max(600).optional(),
})

const stopBody = z
  .object({
    completed: z.boolean().optional(),
    // Client-derived timing (the browser owns the live clock).
    elapsedMs: z.number().int().min(0).optional(),
    pauses: z.number().int().min(0).optional(),
  })
  .optional()

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

router.post('/start', validate({ body: startBody }), focusController.start)
router.post('/stop', validate({ body: stopBody }), focusController.stop)
router.get('/sessions', validate({ query: listQuery }), focusController.list)

export default router
