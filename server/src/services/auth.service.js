import User, { toPublic } from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { signToken } from '../utils/jwt.js'

function nameKeyOf(name) {
  return String(name).trim().toLowerCase()
}

/**
 * Create an account. Throws 409 when the name is taken.
 * Returns { token, user } where user is the public shape.
 */
export async function signup({ name, password }) {
  const trimmed = String(name).trim()
  const nameKey = nameKeyOf(trimmed)

  const existing = await User.findOne({ nameKey }).select('_id')
  if (existing) {
    throw ApiError.conflict('That adventurer name is already taken. Pick another one or log in instead.')
  }

  const passwordHash = await User.hashPassword(password)
  const user = await User.create({ name: trimmed, nameKey, passwordHash })
  return { token: signToken(user), user: toPublic(user) }
}

/**
 * Verify credentials.
 * - unknown name  → 404 USER_NOT_FOUND (lets the client auto-create the
 *                   account, matching the app's single-screen login flow)
 * - wrong passcode → 401 BAD_PASSWORD
 */
export async function login({ name, password }) {
  const user = await User.findOne({ nameKey: nameKeyOf(name) }).select('+passwordHash')
  if (!user) {
    throw new ApiError(404, 'No account with that name yet.', 'USER_NOT_FOUND')
  }
  const ok = await user.verifyPassword(password)
  if (!ok) {
    throw new ApiError(401, 'Incorrect passcode.', 'BAD_PASSWORD')
  }
  return { token: signToken(user), user: toPublic(user) }
}

/** Current user for GET /auth/me. */
export async function me(userId) {
  const user = await User.findById(userId)
  if (!user) throw ApiError.unauthorized('Account no longer exists')
  return { user: toPublic(user) }
}
