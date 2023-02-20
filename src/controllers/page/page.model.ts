import { model, Schema } from 'mongoose'
import { Activity } from '../activity/activities.model'

export interface Page {
  telegramUserId: number
  date: number
  activities: Activity[]
}

const PageSchema = new Schema<Page>({
  telegramUserId: Number,
  date: Number,
  activities: Array<Activity>
})

export const PageModel = model<Page>('page', PageSchema)


