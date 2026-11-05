import { Router } from 'express'
import * as aiController from '../controllers/ai.controller.js'

const router = Router()

router.post('/insights', aiController.insights)
router.get('/weekly-summary', aiController.weeklySummary)
router.post('/suggest-tasks', aiController.suggestTasks)

export default router
