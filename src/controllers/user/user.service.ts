import { User, UserModel } from './user.model'

export class UserService {
  constructor() {
  }

  async getUser(id: number) {
    return UserModel.findOne({ telegramId: id }).exec()
  }

  async createUser(newUser: User) {
    return UserModel.create(newUser)
  }

  async updateUserData(telegramId: number, fieldName: string, value: any) {
    return UserModel.updateOne({ telegramId }, { [fieldName]: value })
  }
}
