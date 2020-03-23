const discord = require("discord.js")
const commandHandler = require("./commands")

const fs = require("fs")
const path = require("path")

const configPath = path.join(__dirname, "..", "config.json")
const configFile = JSON.parse(fs.readFileSync(configPath))

require("dotenv").config()


const client = new discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

client.once("ready", async () => {
    console.log("Queue Bot Online")
})

client.login(process.env.BOT_TOKEN


client.on("message", msg => commandHandler(msg, client, configFile)) 