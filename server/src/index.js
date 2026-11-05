import 'dotenv/config'
import createApp from './app.js'
import env, { ensureSecrets } from './config/env.js'
import { connectDb } from './config/db.js'

async function main() {
  ensureSecrets()
  await connectDb()

  const app = createApp()
  app.listen(env.port, () => {
    console.log(`[api] DailyQuest API listening on http://localhost:${env.port}/api/v1`)
    if (!env.geminiApiKey) {
      console.warn('[ai] GEMINI_API_KEY not set — AI endpoints will use rule-based fallbacks')
    }
  })
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
