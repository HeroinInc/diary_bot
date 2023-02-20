export const TITLE = 'USER_CONTROLLER'
export const ERROR_TITLE = `[${TITLE}_ERROR]:`
export const USER_ALREADY_EXISTS_ERROR = `${ERROR_TITLE} user with such id already exists, filthy liar.`
export const INVALID_NAME_ERROR = `${ERROR_TITLE} name can't be shorter than 3 letters`

export const enum ActivityStatus {
  inProgress = 0,
  finished = 1,
  canceled = 2,
}

export const userActionStatuses = {
  waitNameToEndRegister: 'wait name to end registration',
  waitingForActivityImpression: 'wait for activity impression',
  mainMenu: 'in main menu',
  waitingForNewActivity: 'waiting for adding new activity',
  trackingActivity: 'tracking activity in action',
  settings: 'in settings menu',
  waitingForLanguageChange: 'waiting for new language',
  waitingForStatType: 'waiting for statistics type to show',
}
