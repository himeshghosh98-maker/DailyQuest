import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate.js'
import * as taskController from '../controllers/task.controller.js'

const router = Router()

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Mirrors the frontend's TaskForm fields + bounds (constants.js). */
const taskBody = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  emoji: z.string().max(8).optional(),
  xp: z.number().int().min(5).max(200).optional(),
  type: z.enum(['yesno', 'count', 'timed']).optional(),
  target: z.number().int().min(1).max(999).optional(),
  unit: z.string().max(10).optional(),
  repeat: z.enum(['daily', 'weekdays', 'weekends', 'custom', 'once']).optional(),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  onceDate: z.string().regex(DATE).optional(),
  startDate: z.string().regex(DATE).optional(),
  timeOfDay: z.enum(['any', 'morning', 'afternoon', 'evening']).optional(),
})

// Updates are partial merges (same as the frontend UPDATE_TASK).
const taskPatch = taskBody.partial()

router.get('/', taskController.list)
router.post('/', validate({ body: taskBody }), taskController.create)
router.put('/:id', validate({ body: taskPatch }), taskController.update)
router.delete('/:id', taskController.remove)

export default router
