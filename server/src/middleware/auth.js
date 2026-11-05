import ApiError from '../utils/ApiError.js'
import { verifyToken } from '../utils/jwt.js'

/**
 * Require a valid `Authorization: Bearer <token>` header.
 * On success sets req.user = { id, name }.
 */
export default function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) return next(ApiError.unauthorized())

  try {
    const payload = verifyToken(token)
    req.user = { id: String(payload.sub), name: payload.name }
    return next()
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'))
  }
}
