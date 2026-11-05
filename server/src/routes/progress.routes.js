import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate.js'
import * as taskController from '../controllers/task.controller.js'

const router = Router()

const idParam = z.object({ id: z.string().min(1) })

router.post(
  '/:id/complete',
  validate({ params: idParam, body: z.object({ done: z.boolean().optional() }).optional() }),
  taskController.complete,
)

router.post(
  '/:id/toggle',
  validate({ params: idParam, body: z.object({ done: z.boolean() }) }),
  taskController.toggle,
)

router.put(
  '/:id/count',
  validate({ params: idParam, body: z.object({ value: z.number().int().min(0).max(9999) }) }),
  taskController.count,
)

router.put(
  '/:id/minutes',
  validate({ params: idParam, body: z.object({ value: z.number().int().min(0).max(99999) }) }),
  taskController.minutes,
)

router.post(
  '/:id/timer',
  validate({ params: idParam, body: z.object({ action: z.enum(['start', 'stop']) }) }),
  taskController.timer,
)

export default router
