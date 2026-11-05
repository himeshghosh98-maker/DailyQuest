import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate.js'
import requireAuth from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

const name = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(1, 'Please enter your name.')
  .max(30, 'Name must be 30 characters or fewer.')

const password = z
  .string({ required_error: 'Passcode is required' })
  .min(6, 'Passcode must be at least 6 characters.')
  .max(128, 'Passcode is too long.')

const credentials = z.object({ name, password })

router.post('/signup', validate({ body: credentials }), authController.signup)
router.post('/login', validate({ body: credentials }), authController.login)
router.get('/me', requireAuth, authController.me)

export default router
