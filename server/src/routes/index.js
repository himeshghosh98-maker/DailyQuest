import { Router } from 'express'
import authRoutes from './auth.routes.js'
import taskRoutes from './task.routes.js'
import progressRoutes from './progress.routes.js'
import statsRoutes from './stats.routes.js'
import stateRoutes from './state.routes.js'
import focusRoutes from './focus.routes.js'
import reportRoutes from './report.routes.js'
import aiRoutes from './ai.routes.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ name: 'DailyQuest API', version: 'v1' })
})

router.use('/auth', authRoutes)

// Everything below requires a valid JWT.
router.use('/tasks', requireAuth, taskRoutes)
router.use('/progress', requireAuth, progressRoutes)
router.use('/stats', requireAuth, statsRoutes)
router.use('/state', requireAuth, stateRoutes)
router.use('/focus', requireAuth, focusRoutes)
router.use('/reports', requireAuth, reportRoutes)
router.use('/ai', requireAuth, aiRoutes)

// Mounted as they land: focus → reports → ai (see README).

export default router
