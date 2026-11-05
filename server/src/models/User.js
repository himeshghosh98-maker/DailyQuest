import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * App user. `nameKey` is the lowercased name used for case-insensitive
 * uniqueness; `name` keeps the casing the user typed (it is shown in the UI).
 * The password hash never leaves the server.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    nameKey: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
)

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.toPublic = function toPublic() {
  return { id: String(this._id), name: this.name, createdAt: this.createdAt }
}

/** Shape sent to the client (no hash, ever). */
export function toPublic(user) {
  return user ? { id: String(user._id), name: user.name, createdAt: user.createdAt } : null
}

export default mongoose.model('User', userSchema)
