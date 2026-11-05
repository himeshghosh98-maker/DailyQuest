import mongoose from 'mongoose'
import { DATA_VERSION } from '../config/constants.js'

/**
 * The per-user app state, stored EXACTLY as the frontend shape:
 * { version, tasks, totalXp, history, focusSessions, focus, badges,
 *   settings, lastActiveDate }.
 *
 * One document per user keeps client/server shapes byte-compatible (the
 * offline cache syncs the whole blob) while granular task/progress
 * endpoints mutate the same document through services.
 */
const stateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    version: { type: Number, default: DATA_VERSION },
    tasks: { type: mongoose.Schema.Types.Mixed, default: [] },
    totalXp: { type: Number, default: 0 },
    history: { type: mongoose.Schema.Types.Mixed, default: [] },
    focusSessions: { type: mongoose.Schema.Types.Mixed, default: [] },
    focus: { type: mongoose.Schema.Types.Mixed, default: null },
    badges: { type: mongoose.Schema.Types.Mixed, default: {} },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastActiveDate: { type: String, default: '' },
    /** When the one-time localStorage → server migration ran (null = never). */
    migratedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export default mongoose.model('State', stateSchema)
