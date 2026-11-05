import jwt from 'jsonwebtoken'
import env from '../config/env.js'

/** Sign a JWT for a user (stays server-side; client only sees the string). */
export function signToken(user) {
  return jwt.sign({ sub: String(user._id), name: user.name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })
}

/** Verify + decode. Throws on invalid/expired tokens. */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}
