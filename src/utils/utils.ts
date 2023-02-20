import { InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup } from 'node-telegram-bot-api'

export function createReplyMarkup(buttons: string[], columnsInARow = 3): ReplyKeyboardMarkup {
  const keyboard = buttons.reduce((previousValue: any, currentValue) => {
    if (!previousValue[0]) {
      previousValue.push([createButton(currentValue)])
    } else {
      const currentLen = previousValue.length
      if (previousValue[currentLen - 1].length > columnsInARow - 1) {
        previousValue.push([createButton(currentValue)])
      } else {
        previousValue[currentLen - 1].push(createButton(currentValue))
      }
    }
    return previousValue
  }, [])
  return { keyboard, one_time_keyboard: true, resize_keyboard: true }
}

export function createInlineReplyMarkup(buttons: string[]): InlineKeyboardMarkup {
  return { inline_keyboard: buttons.map(createInlineButton).map(val => [val]) }
}

export function createInlineReplyMarkupWIthDelButtons(buttons: string[]): InlineKeyboardMarkup {
  return { inline_keyboard: buttons.map(createInlineButtonAndDeleteButton) }
}

export function createButton(text: string): KeyboardButton {
  return { text }
}

export function createInlineButton(text: string): InlineKeyboardButton {
  return { text, callback_data: text }
}

export function createInlineButtonAndDeleteButton(text: string): InlineKeyboardButton[] {
  return [
    { text, callback_data: text },
    { text: '❌', callback_data: `delete ${text}` },
  ]
}

export function parseMillisecondsToString(milliseconds: number) {
  let hours = Math.floor(milliseconds / (3600 * 1000))
  let minutes = hours ? Math.floor((milliseconds - hours * (3600 * 1000)) / (60 * 1000)) : Math.floor(milliseconds / (60 * 1000))
  let seconds = Math.floor((milliseconds % (60 * 1000)) / 1000)
  const strHours = String(hours).length > 1 ? String(hours) : `0${hours}`
  const strMinutes = String(minutes).length > 1 ? String(minutes) : `0${minutes}`
  const strSeconds = String(seconds).length > 1 ? String(seconds) : `0${seconds}`

  return `${strHours}:${strMinutes}:${strSeconds}`
}
