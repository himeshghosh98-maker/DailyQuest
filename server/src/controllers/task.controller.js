import asyncHandler from '../utils/asyncHandler.js'
import * as taskService from '../services/task.service.js'

/** GET /api/v1/tasks */
export const list = asyncHandler(async (req, res) => {
  res.json(await taskService.listTasks(req.user.id))
})

/** POST /api/v1/tasks */
export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await taskService.createTask(req.user.id, req.body))
})

/** PUT /api/v1/tasks/:id */
export const update = asyncHandler(async (req, res) => {
  res.json(await taskService.updateTask(req.user.id, req.params.id, req.body))
})

/** DELETE /api/v1/tasks/:id */
export const remove = asyncHandler(async (req, res) => {
  res.json(await taskService.deleteTask(req.user.id, req.params.id))
})

/** POST /api/v1/progress/:id/complete — mark done / undo (any task type). */
export const complete = asyncHandler(async (req, res) => {
  const { done = true } = req.body || {}
  res.json(await taskService.completeTask(req.user.id, req.params.id, done))
})

/** POST /api/v1/progress/:id/toggle — yes/no checkbox. */
export const toggle = asyncHandler(async (req, res) => {
  const { done } = req.body || {}
  res.json(await taskService.setDone(req.user.id, req.params.id, done))
})

/** PUT /api/v1/progress/:id/count — count stepper. */
export const count = asyncHandler(async (req, res) => {
  res.json(await taskService.setCount(req.user.id, req.params.id, req.body.value))
})

/** PUT /api/v1/progress/:id/minutes — timed minutes. */
export const minutes = asyncHandler(async (req, res) => {
  res.json(await taskService.setMinutes(req.user.id, req.params.id, req.body.value))
})

/** POST /api/v1/progress/:id/timer — start/stop the timed-task timer. */
export const timer = asyncHandler(async (req, res) => {
  res.json(await taskService.controlTimer(req.user.id, req.params.id, req.body.action))
})
