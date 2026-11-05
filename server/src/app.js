import express from 'express'
import cors from 'cors'
import env from './config/env.js'
import routes from './routes/index.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/errorHandler.js'

/** Dev servers hop ports (3000/3001/5173…) — allow any localhost origin outside production. */
function isAllowedOrigin(origin) {
  if (env.corsOrigins.includes(origin)) return true
  if (env.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true
  }
  return false
}

/** Build the Express app (no listening — see index.js). */
export default function createApp() {
  const app = express()
  app.disable('x-powered-by')

  // CORS: allow configured dev origins; also allow same-origin/no-origin
  // requests (mobile apps, curl) which send no Origin header.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || isAllowedOrigin(origin)) return cb(null, true)
        return cb(null, false)
      },
      credentials: false,
    }),
  )

  app.use(express.json({ limit: '2mb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }))

  app.use('/api/v1', routes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
