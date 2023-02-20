import { PageModel } from './page.model'
import { Types } from 'mongoose'
import { Activity } from '../activity/activities.model'
import { User } from '../user/user.model'
import { botInterface } from '../../entities/bot/botInterface'
import { parseMillisecondsToString } from '../../utils/utils'

export class PageService {

  constructor() {
  }

  yesterdayAndTomorrow() {
    const now = new Date()
    const yesterday = (new Date(now.getTime() - 86400000)).setHours(23, 59, 59)
    const tomorrow = new Date(now.getTime() + 86400000).setHours(0, 0, 0)
    return [yesterday, tomorrow]
  }

  async getCurrentPage(telegramUserId: number) {
    const [yesterday, tomorrow] = this.yesterdayAndTomorrow()
    return PageModel.findOne({ telegramUserId, date: { $gt: yesterday, $lt: tomorrow } }).exec()
  }

  async createPage(telegramUserId: number) {
    return PageModel.create({ telegramUserId, date: Date.now() })
  }

  async pushActivityToPage(_id: Types.ObjectId, activity: Activity) {
    return PageModel.findByIdAndUpdate(_id, { $push: { activities: activity } })
  }

  async getAllUserPages(telegramUserId: number) {
    return PageModel.find({ telegramUserId }).exec()
  }

  async getUserTopActivity(telegramUserId: number, user: User) {
    const allPages = await this.getAllUserPages(telegramUserId)
    if (!allPages || allPages.length < 1 || !user.lang) return false
    const activitiesMap = new Map()

    allPages.forEach(({ activities }) => {
      activities.forEach(({ name, startAt, endAt, impression }) => {
        const newValue = !activitiesMap.has(name)
        const currentActivity = newValue ? {} : activitiesMap.get(name)
        currentActivity.name = name
        if (!startAt || !endAt) return

        currentActivity.duration = newValue
          ? endAt - startAt
          : currentActivity.duration + endAt - startAt
        currentActivity.impressionns = newValue ? [impression] : currentActivity.impressionns.concat([impression])
        activitiesMap.set(name, currentActivity)
      })
    })

    const activitiesTotalArray = Array.from(activitiesMap.values())
    let [maxDuration, maxDurationIndex] = [-1, -1]
    activitiesTotalArray.forEach(({ duration }, index) => {
      if (duration > maxDuration) {
        maxDuration = duration
        maxDurationIndex = index
      }
    })

    const favourite = activitiesTotalArray[maxDurationIndex]

    if (favourite) {
      const title = `${botInterface[user.lang].messages.activityName}: ${favourite.name}\n\n`
      const time = `${botInterface[user.lang].messages.activityDuration}: ${parseMillisecondsToString(favourite.duration)}\n\n`
      const description = botInterface[user.lang].messages.activityImpression + ':\n' + favourite
        .impressionns.reduce((prev: string, curr: string) => {
          return prev + curr + '\n\n'
        }, '')

      return title + time + description
    }

    return false
  }

}
