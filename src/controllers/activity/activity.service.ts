import { ActivitiesModel } from './activities.model'
import { IAddActivity } from './constants'
import { createInlineReplyMarkupWIthDelButtons } from '../../utils/utils'

export class ActivityService {
  constructor() {
  }

  async getActivities(telegramUserId: number) {
    return ActivitiesModel.findOne({ telegramUserId }, { _id: 0, activities: 1 }).exec()
  }

  async updateActivities({ telegramUserId, name }: IAddActivity) {
    return ActivitiesModel.updateOne(
      { telegramUserId },
      { $push: { activities: name } },
      { upsert: true },
    )
  }

  async setNewActivitiesList(telegramId: number, activitiesList: string[]) {
    return ActivitiesModel.updateOne({
      telegramUserId: telegramId,
      activities: activitiesList
    })
  }

  createActivitiesMarkup(activitiesArray: string[]) {
    return createInlineReplyMarkupWIthDelButtons(activitiesArray)
  }
}
