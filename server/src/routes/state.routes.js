import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate.js'
import * as stateController from '../controllers/state.controller.js'

const router = Router()

// PUT body is validated by sanitizeIncoming() in the service (it must
// accept *any* object shape the client may have cached, warts and all).
const migrateBody = z.object({ state: z.unknown() })

router.get('/', stateController.get)
router.put('/', stateController.replace)
router.post('/migrate', validate({ body: migrateBody }), stateController.migrate)

export default router
