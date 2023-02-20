import { UserService } from './user.service'
import { User } from './user.model'
import { USER_ALREADY_EXISTS_ERROR } from './constants'
import { Activity } from '../activity/activities.model'

export class UserController {
  userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  async findUser(id: number) {
    return this.userService.getUser(id)
  }

  async createUser(newUser: User) {
    const existingUser = await this.findUser(newUser.telegramId)

    if (existingUser) {
      throw new Error(USER_ALREADY_EXISTS_ERROR)
    }

    return this.userService.createUser(newUser)
  }

  async updateUserData(userId: number, fieldName: string, value: any) {
    return this.userService.updateUserData(userId, fieldName, value)
  }

  async setActivity(userId: number, newActivity: Activity) {
    return this.updateUserData(userId, 'currentActivity', newActivity)
  }

  async setCurrentAction(userId: number, newAction: string) {
    return this.updateUserData(userId, 'currentAction', newAction)
  }
}
