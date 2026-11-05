import asyncHandler from '../utils/asyncHandler.js'
import * as authService from '../services/auth.service.js'

/** POST /api/v1/auth/signup */
export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body)
  res.status(201).json(result)
})

/** POST /api/v1/auth/login */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body)
  res.json(result)
})

/** GET /api/v1/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json(await authService.me(req.user.id))
})
