import mongoose from 'mongoose'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import env, { isProd } from './env.js'

let memoryServer = null

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DEV_DB_PATH = path.join(ROOT_DIR, '.mongo-data')

/**
 * Connect to MongoDB.
 * - MONGODB_URI set  → use it (local or Atlas)
 * - unset (dev)      → auto-provision a local on-disk MongoDB (via
 *                      mongodb-memory-server) so the app runs with zero
 *                      setup; data persists across restarts in
 *                      server/.mongo-data (git-ignored).
 * - unset (prod)     → refuse to start.
 */
export async function connectDb() {
  let uri = env.mongoUri

  if (!uri) {
    if (isProd()) throw new Error('MONGODB_URI must be set in production')
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    fs.mkdirSync(DEV_DB_PATH, { recursive: true })
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath: DEV_DB_PATH, storageEngine: 'wiredTiger' },
    })
    uri = memoryServer.getUri('dailyquest')
    console.warn(`[db] MONGODB_URI not set — using local dev MongoDB at ${DEV_DB_PATH}`)
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  console.log(`[db] connected (${maskUri(uri)})`)
  return uri
}

export async function disconnectDb() {
  await mongoose.disconnect().catch(() => {})
  if (memoryServer) {
    await memoryServer.stop().catch(() => {})
    memoryServer = null
  }
}

/** Hide credentials before logging a connection string. */
function maskUri(uri) {
  try {
    const u = new URL(uri)
    if (u.password) u.password = '***'
    return u.toString()
  } catch {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
  }
}
