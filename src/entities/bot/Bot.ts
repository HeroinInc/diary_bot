import TelegramBot from 'node-telegram-bot-api'
import { UserController } from '../../controllers/user/user.controller'
import { PageController } from '../../controllers/page/page.controller'
import { ActivityController } from '../../controllers/activity/activity.controller'
import { botInterface, messageTypes } from './botInterface'
import { botDefaultInterfaceLanguage } from './constants'
import {
  createInlineReplyMarkup,
  createInlineReplyMarkupWIthDelButtons,
  createReplyMarkup,
  parseMillisecondsToString,
} from '../../utils/utils'
import { userActionStatuses } from '../../controllers/user/constants'
import { config } from 'dotenv'
import { User } from '../../controllers/user/user.model'

config()
const botToken = process.env.BOT_TOKEN ? process.env.BOT_TOKEN : ''


export class Bot {
  bot: TelegramBot
  usersController: UserController
  pageController: PageController
  activitiesController: ActivityController

  constructor() {
    this.bot = new TelegramBot(botToken, { polling: true })
    this.usersController = new UserController()
    this.pageController = new PageController()
    this.activitiesController = new ActivityController()
  }

  config() {
    this.bot.on('message', async (message) => {
      const chatId = message.chat.id
      const messageText = message.text ? message.text : ''
      const currentUser = await this.usersController.findUser(chatId)

      if (!currentUser && !messageTypes.register.includes(messageText)) {
        this.forceToRegister(chatId).then()
      } else if (!currentUser) {
        this.register(chatId).then()
      } else {
        this.mainHandler(chatId, message).then()
      }
    })

    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id ? query.message?.chat.id : 0
      const user = await this.usersController.findUser(chatId)
      if (user) {
        await this.mainInlineQueryHandler(query, user, chatId)
      } else {
        await this.bot.sendMessage(chatId, botInterface[botDefaultInterfaceLanguage].messages.shouldBeRegistered)
        await this.forceToRegister(chatId)
      }
    })
  }

  async updateUserStatus(telegramId: number, status: string) {
    await this.usersController.updateUserData(telegramId, 'currentAction', status)
  }

  async setUserDefaultState(telegramId: number) {
    await this.updateUserStatus(telegramId, userActionStatuses.mainMenu)
  }

  async forceToRegister(chatId: number) {
    await this.bot.sendMessage(chatId, botInterface[botDefaultInterfaceLanguage].messages.hello, {
      reply_markup: createReplyMarkup(botInterface[botDefaultInterfaceLanguage].buttons.initial),
    })
  }

  async register(chatId: number) {
    await this.bot.sendMessage(chatId, botInterface[botDefaultInterfaceLanguage].messages.sendYourName)
    await this.usersController.createUser({
      telegramId: chatId,
      name: 'defaultName',
      registeredAt: Date.now(),
      lang: botDefaultInterfaceLanguage,
      currentAction: userActionStatuses.waitNameToEndRegister,
    })
  }

  async endRegistration(chatId: number, name: string) {
    const res = await this.usersController.updateUserData(chatId, 'name', name)
    if (res) {
      await this.setUserDefaultState(chatId)
      await this.bot.sendMessage(
        chatId,
        botInterface[botDefaultInterfaceLanguage].messages.successfullyRegistered,
        { reply_markup: createReplyMarkup(botInterface[botDefaultInterfaceLanguage].buttons.main) },
      )
    }
  }

  async setWaitForNewActivity(telegramId: number, user: User) {
    if (!user.lang) return

    await this.usersController.updateUserData(
      telegramId,
      'currentAction',
      userActionStatuses.waitingForNewActivity,
    )

    await this.bot.sendMessage(
      telegramId,
      botInterface[user.lang].messages.addActivity,
      { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.cancel) },
    )
  }

  async addActivity(telegramId: number, activity: string, user: User) {
    if (!user.lang) return

    const doc = await this.activitiesController.addActivity({
      name: activity,
      telegramUserId: telegramId,
    })
    if (doc) {
      await this.bot.sendMessage(
        telegramId,
        botInterface[user.lang].messages.successfullyAddedActivity,
        { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) })
    } else {
      await this.bot.sendMessage(
        telegramId,
        botInterface[user.lang].messages.activityExists,
        { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) })
    }

    await this.setUserDefaultState(telegramId)
  }

  async displayActivities(chatId: number, user: User) {
    if (!user.lang) return

    const userActivities = await this.activitiesController.getActivitiesList(chatId)
    if (userActivities && Array.isArray(userActivities.activities) && userActivities.activities.length > 0) {
      const activitiesMarkup = this.activitiesController.createActivitiesMarkup(userActivities.activities)
      await this.bot.sendMessage(chatId, botInterface[user.lang].messages.activitiesListSent, { reply_markup: activitiesMarkup })
    } else {
      await this.bot.sendMessage(
        chatId,
        botInterface[user.lang].messages.youHaveNoActivitiesYet,
        { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) },
      )

      await this.setUserDefaultState(chatId)
    }
  }

  async deleteActivity(query: TelegramBot.CallbackQuery, user: User) {
    const messageId = query.message?.message_id ? query.message?.message_id : 0
    const chatId = query.message?.chat.id ? query.message?.chat.id : 0
    let activityToDelete = query.data ? query.data : ''
    activityToDelete = activityToDelete.replace(/delete /, '')
    const updateResult = await this.activitiesController.deleteActivity(chatId, activityToDelete)

    if (updateResult) {
      const newMarkup = createInlineReplyMarkupWIthDelButtons(updateResult)
      await this.updateMessageMarkup(chatId, messageId, newMarkup)
    }

  }

  async updateMessageMarkup(chatId: number, messageId: number, markup: TelegramBot.InlineKeyboardMarkup) {
    await this.bot.editMessageReplyMarkup(markup, { chat_id: chatId, message_id: messageId })
  }

  async startTrackingActivity(chatId: number, user: User, data: string) {
    const newActivity = { name: data, startAt: Date.now() }
    const result = await this.usersController.setActivity(chatId, newActivity)
    if (!user.lang) return

    if (result.modifiedCount > 0) {
      await this.updateUserStatus(chatId, userActionStatuses.trackingActivity)
      await this.bot.sendMessage(
        chatId,
        botInterface[user.lang].messages.startedTrackActivity + data,
        {
          reply_markup: createReplyMarkup(
            [...botInterface[user.lang].buttons.stop, ...botInterface[user.lang].buttons.cancel]),
        },
      )
      return true
    }
  }

  async stopActivityTracking(chatId: number, user: User) {
    if (!user.currentActivity) return this.cancelAll(chatId, user)

    const now = Date.now()
    const startAt = user.currentActivity.startAt ? user.currentActivity.startAt : 0
    const currentActivity = user.currentActivity?.name ? user.currentActivity?.name : ''
    const tookTime = now - startAt
    const realTime = parseMillisecondsToString(tookTime)
    user.currentActivity.endAt = now
    user.currentActivity.duration = realTime
    const updated = await this.usersController.updateUserData(chatId, 'currentActivity', user.currentActivity)

    if (updated.modifiedCount > 0) {
      await this.updateUserStatus(chatId, userActionStatuses.waitingForActivityImpression)

      if (user.lang) {
        const message1 = botInterface[user.lang].messages.activityRecorded(currentActivity)
        const message2 = botInterface[user.lang].messages.timeElapsedSinceStart(realTime)
        const summaryMessage = message2 + '\n\n' + message1
        await this.bot.sendMessage(chatId, summaryMessage, { reply_markup: { remove_keyboard: true } })

      }
    }
  }

  async writeToPage(chatId: number, message: TelegramBot.Message) {
    const user = await this.usersController.findUser(chatId)

    if (user && user.currentActivity && user.lang) {
      user.currentActivity.impression = message.text
      const pushed = await this.pageController.pushActivityOnCurrentPage(chatId, user.currentActivity)

      if (pushed) {
        await this.setUserDefaultState(chatId)
        await this.bot.sendMessage(
          chatId,
          botInterface[user.lang].messages.activityImpressionRecorded,
          { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) },
        )
      }

    }
  }

  async cancelAll(chatId: number, user: User) {
    if (!user.lang) return this.setUserDefaultState(chatId)

    await this.setUserDefaultState(chatId)
    await this.bot.sendMessage(
      chatId,
      botInterface[user.lang].messages.canceled,
      { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) },
    )
  }

  async showSettings(chatId: number, user: User) {
    if (!user.lang) return
    await this.usersController.setCurrentAction(chatId, userActionStatuses.settings)
    await this.bot.sendMessage(
      chatId,
      botInterface[user.lang].messages.settingsMessage,
      {
        reply_markup: createReplyMarkup([
          ...botInterface[user.lang].buttons.settings,
          ...botInterface[user.lang].buttons.cancel,
        ]),
      },
    )
  }

  async changeLanguageButtonPushed(chatId: number, user: User) {
    if (!user.lang) return
    await this.usersController.setCurrentAction(chatId, userActionStatuses.waitingForLanguageChange)
    await this.bot.sendMessage(chatId, botInterface[user.lang].messages.pickLanguage,
      {
        reply_markup: createReplyMarkup(
          [...botInterface.languages, ...botInterface[user.lang].buttons.cancel],
        ),
      })
  }

  async changeLanguage(chatId: number, message: TelegramBot.Message, user: User) {
    if (!user.lang || !message.text) return

    if (botInterface.languages.includes(message.text)) {
      const response = await this.usersController.updateUserData(chatId, 'lang', message.text)

      if (response.modifiedCount > 0) {
        await this.setUserDefaultState(chatId)

        return this.bot.sendMessage(
          chatId,
          // @ts-ignore
          botInterface[message.text].messages.languageChanged,
          // @ts-ignore
          { reply_markup: createReplyMarkup(botInterface[message.text].buttons.main) },
        )
      }
    }

    return this.cancelAll(chatId, user)
  }

  async statisticButtonPushed(chatId: number, user: User) {
    if (!user.lang) return

    const updated = await this.usersController.setCurrentAction(chatId, userActionStatuses.waitingForStatType)
    if (updated.modifiedCount) {
      await this.bot.sendMessage(chatId, botInterface[user.lang].messages.pickStatType, {
        reply_markup: createReplyMarkup([
          ...botInterface[user.lang].buttons.statics,
          ...botInterface[user.lang].buttons.cancel,
        ]),
      })
    }
  }

  async showDailyStat(chatId: number, user: User) {
    const currentActivities = await this.pageController.getTodayActivities(chatId)
    if (!currentActivities || !Array.isArray(currentActivities) || !user.lang) return this.cancelAll(chatId, user)

    const msg = currentActivities.reduce((prev, curr) => {
      const { name, duration, impression } = curr
      if (!user.lang) return prev
      const msgTitle = `${botInterface[user.lang].messages.activityName}: ${name}\n`
      const msgDuration = `${botInterface[user.lang].messages.activityDuration}: ${duration}\n`
      const msgImpression = `${botInterface[user.lang].messages.activityImpression}: ${impression}\n`

      const record = `${msgTitle}${msgDuration}${msgImpression}\n`
      prev += record
      return prev
    }, '')

    await this.setUserDefaultState(chatId)
    await this.bot.sendMessage(chatId, msg,
      { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) },
    )


  }

  async showWeaklyStat() {
    // todo
  }

  async showFullStat() {
    //   todo
  }

  async showFavouriteActivity(chatId: number, user: User) {
    const topActivity = await this.pageController.getTopActivity(chatId, user)
    if (topActivity && user.lang) {
      await this.bot.sendMessage(chatId, topActivity,
        { reply_markup: createReplyMarkup(botInterface[user.lang].buttons.main) })
    }
    await this.setUserDefaultState(chatId)
  }

  async showStat(chatId: number, message: TelegramBot.Message, user: User) {
    if (!user.lang || !message.text) {
      return this.cancelAll(chatId, user)
    }

    switch (message.text) {
      case botInterface[user.lang].buttons.statics[0]:
        return this.showDailyStat(chatId, user)
      case botInterface[user.lang].buttons.statics[1]:// todo
        return this.showWeaklyStat()
      case botInterface[user.lang].buttons.statics[2]:// todo
        return this.showFullStat()
      case botInterface[user.lang].buttons.statics[3]:// todo
        return this.showFavouriteActivity(chatId, user)
    }
  }

  async mainHandler(chatId: number, message: TelegramBot.Message) {
    const user = await this.usersController.findUser(chatId)
    if (!user || !user.lang) return this.forceToRegister(chatId)
    if (message.text === botInterface[user.lang].buttons.cancel[0]) return this.cancelAll(chatId, user)

    switch (user.currentAction) {
      case userActionStatuses.waitNameToEndRegister:
        return this.endRegistration(chatId, message.text ? message.text : 'cheater')

      case userActionStatuses.waitingForNewActivity:
        return this.addActivity(chatId, message.text ? message.text : 'cheater', user)

      case userActionStatuses.mainMenu:
        switch (message.text) {
          case botInterface[user.lang].buttons.main[0]:
            return this.setWaitForNewActivity(chatId, user)
          case botInterface[user.lang].buttons.main[1]:
            return this.displayActivities(chatId, user)
          case botInterface[user.lang].buttons.main[2]:
            return this.statisticButtonPushed(chatId, user)
          case botInterface[user.lang].buttons.main[3]:
            return this.showSettings(chatId, user)
        }
        break

      case userActionStatuses.trackingActivity:
        switch (message.text) {
          case botInterface[user.lang].buttons.stop[0]:
            return this.stopActivityTracking(chatId, user)
        }
        break

      case userActionStatuses.waitingForActivityImpression:
        switch (!!message.text) {
          case true:
            return this.writeToPage(chatId, message)
        }
        break

      case userActionStatuses.settings:
        switch (message.text) {
          case botInterface[user.lang].buttons.settings[0]:
            return this.changeLanguageButtonPushed(chatId, user)
        }
        break

      case userActionStatuses.waitingForLanguageChange:
        return this.changeLanguage(chatId, message, user)

      case userActionStatuses.waitingForStatType:
        return this.showStat(chatId, message, user)
    }

  }

  async mainInlineQueryHandler(query: TelegramBot.CallbackQuery, user: User, chatId: number) {
    if (!user.lang) return
    const repliedToMessage = query.message?.text
    const queryData = query.data ? query.data : ''
    const currentUserAction = user.currentAction

    switch (repliedToMessage) {
      case botInterface[user.lang].messages.activitiesListSent:
        if (queryData.match(/delete/)) {
          return await this.deleteActivity(query, user)
        }

        switch (currentUserAction) {
          case userActionStatuses.mainMenu:
            const stared = await this.startTrackingActivity(chatId, user, queryData)
            if (stared) {
              await this.bot.editMessageReplyMarkup(
                createInlineReplyMarkup([`⏱${queryData}⏱`]),
                { chat_id: chatId, message_id: query.message?.message_id },
              )
            }
            break
          case userActionStatuses.trackingActivity:
            await this.bot.sendMessage(chatId, botInterface[user.lang].messages.alreadyInProgressActivity)
            break
        }
        break
    }
  }
}
