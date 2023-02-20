import mongoose from 'mongoose'
import { config } from 'dotenv'
import { Bot } from './entities/bot/Bot'

async function main() {
  config()
  mongoose.set('strictQuery', true)
  const dbConnectionUrl = process.env.DB_CONECTION ? process.env.DB_CONECTION : ''
  await mongoose.connect(dbConnectionUrl)
  const bot = new Bot()
  bot.config()
}

main().catch(e => console.log(e))

process.on('uncaughtException', (error) => {
  console.log(error)
})
