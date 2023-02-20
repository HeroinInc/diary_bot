import { IAddActivity } from './constants'
import { ActivityService } from './activity.service'
import { InlineKeyboardMarkup } from 'node-telegram-bot-api'

export class ActivityController {
  activitiesService: ActivityService

  constructor() {
    this.activitiesService = new ActivityService()
  }

  async getActivitiesList(telegramUserId: number) {
    return this.activitiesService.getActivities(telegramUserId)
  }

  async addActivity({ name, telegramUserId }: IAddActivity) {
    const lowerCaseActivity = name.toLowerCase()

    const doc = await this.activitiesService.getActivities(telegramUserId)

    if (doc && doc.activities) {
      const { activities } = doc
      if (!activities.find(activity => activity === lowerCaseActivity)) {
        return await this.activitiesService.updateActivities({telegramUserId, name: lowerCaseActivity})
      }
      return false
    } else if (!doc) {
      return await this.activitiesService.updateActivities({telegramUserId, name: lowerCaseActivity})
    }
  }

  async setNewActivitiesList(telegramId: number, activitiesList: string[]){
    const result = await this.activitiesService.setNewActivitiesList(telegramId, activitiesList)
    return result ? activitiesList : false
  }

  async deleteActivity(telegramId: number, activity: string) {
    const activities = await this.activitiesService.getActivities(telegramId)
    if (activities && activities.activities && Array.isArray(activities.activities)) {
      return this.setNewActivitiesList(telegramId, activities.activities.filter(a => a !== activity))
    }
    return  false
  }

  createActivitiesMarkup(activitiesArray: string[]): InlineKeyboardMarkup {
    return this.activitiesService.createActivitiesMarkup(activitiesArray)
  }
}
