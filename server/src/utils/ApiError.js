/** Operational error with an HTTP status + machine-readable code. */
export default class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
  }

  static badRequest(message, details) {
    return new ApiError(400, message, 'BAD_REQUEST', details)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED')
  }

  static forbidden(message = 'Not allowed') {
    return new ApiError(403, message, 'FORBIDDEN')
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND')
  }

  static conflict(message, details) {
    return new ApiError(409, message, 'CONFLICT', details)
  }
}
