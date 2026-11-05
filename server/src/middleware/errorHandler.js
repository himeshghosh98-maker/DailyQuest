import env, { isProd } from '../config/env.js'

/**
 * Centralized error handler. Every error thrown anywhere in the app lands
 * here and leaves as JSON: { message, code, details? }.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500
  let code = err.code && typeof err.code === 'string' ? err.code : 'INTERNAL'
  let message = err.message || 'Something went wrong'
  let details = err.details

  // Zod validation errors → 400 with field details.
  if (err.name === 'ZodError' || err?.issues?.length) {
    status = 400
    code = 'VALIDATION'
    message = 'Validation failed'
    details = (err.issues || []).map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))
  }

  // Mongoose validation → 400.
  if (err.name === 'ValidationError' && status === 500) {
    status = 400
    code = 'VALIDATION'
    message = Object.values(err.errors || {}).map((e) => e.message).join('; ') || message
  }

  // Duplicate key (e.g. username taken) → 409.
  if (err.code === 11000) {
    status = 409
    code = 'CONFLICT'
    message = 'That name is already taken'
  }

  // CastError (bad ObjectId) → 404-ish client error, never a crash.
  if (err.name === 'CastError') {
    status = 400
    code = 'BAD_REQUEST'
    message = 'Invalid id'
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err)
    if (!isProd()) message = err.message || message
  }

  res.status(status).json({ message, code, ...(details ? { details } : {}) })
}
