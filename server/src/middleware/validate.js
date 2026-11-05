import ApiError from '../utils/ApiError.js'

/**
 * Request validation with zod schemas:
 *   router.post('/', validate({ body: CreateTask }), handler)
 * Parsed values replace the originals (req.body / req.query), so controllers
 * can trust types & defaults. Unknown keys are stripped.
 */
export default function validate(schemas) {
  return (req, _res, next) => {
    try {
      for (const key of ['query', 'body', 'params']) {
        const schema = schemas?.[key]
        if (!schema) continue
        const result = schema.safeParse(req[key])
        if (!result.success) return next(result.error)
        if (key === 'body') req.body = result.data
        // req.query / req.params may be getters — reassign safely.
        else Object.defineProperty(req, key, { value: result.data, writable: true, configurable: true })
      }
      return next()
    } catch (err) {
      return next(ApiError.badRequest(err.message))
    }
  }
}
