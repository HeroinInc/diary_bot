import { Schema, model } from 'mongoose'
import { ActivityStatus } from './constants'
import { langType } from '../../commonTypes'
import { Activity, ActivitySchema } from '../activity/activities.model'

export interface User {
  telegramId: number
  name?: string
  lang?: langType
  registeredAt?: number
  points?: number
  currentActivity?: Activity
  activityStatus?: ActivityStatus
  startedAt?: number
  currentAction?: string
}

const UserSchema = new Schema<User>({
  telegramId: Number,
  name: String,
  lang: String,
  registeredAt: Date,
  points: Number,
  currentActivity: ActivitySchema,
  activityStatus: Number,
  startedAt: Number,
  currentAction: String

})

export const UserModel = model<User>('User', UserSchema)
