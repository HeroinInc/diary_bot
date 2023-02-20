import { model, Schema } from 'mongoose'

export interface Activity {
  name: string
  startAt: number
  endAt?: number
  duration?: string
  impression?: string
}

export const ActivitySchema = new Schema<Activity>({
  name: String,
  startAt: Number,
  endAt: Number,
  impression: String,
  duration: String,
})

export interface Activities {
  telegramUserId: number
  activities: string[]
}

const ActivitiesSchema = new Schema<Activities>({
  telegramUserId: Number,
  activities: Array<string>
})

export const ActivitiesModel = model<Activities>('activities', ActivitiesSchema)


