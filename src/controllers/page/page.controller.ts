import { PageService } from './page.service'
import { Activity } from '../activity/activities.model'
import { User } from '../user/user.model'

export class PageController {
  pageService: PageService

  constructor() {
    this.pageService = new PageService()
  }

  async getCurrentPageId(telegramUserId: number) {
    const page = await this.pageService.getCurrentPage(telegramUserId)

    if (page) {
      return page._id
    }

    const newPage = await this.pageService.createPage(telegramUserId)
    return newPage._id
  }

  async pushActivityOnCurrentPage(telegramUserId: number, activity: Activity) {
    const pageId = await this.getCurrentPageId(telegramUserId)
    return this.pageService.pushActivityToPage(pageId, activity)
  }

  async getTodayActivities(telegramUserId: number): Promise<boolean | Activity[]> {
    const page = await this.pageService.getCurrentPage(telegramUserId)
    return page && page.activities ? page.activities : false
  }

  async getTopActivity(telegramUserId: number, user: User) {
    return this.pageService.getUserTopActivity(telegramUserId, user)
  }
}
