
const qHandler = require("./qHandler")
const moment = require("moment");
require("moment-duration-format");

const functions =  {
        "q": qHandler,
        "uptime": async (msg, {args, client}) => await msg.channel.send("Uptime: " + moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]"))
    }

module.exports = (msg, client, config) => {
    if(msg.author.bot) return
    if (msg.channel.id !== config.botTalkId) return
    const {
        prefix
    } = config

    if(msg.content.startsWith(prefix)){
        const args = msg.content.split(" ")
        const command = args.shift().substr(prefix.length)
        const func = functions[command]
        if (Object.keys(functions).includes(command)){
            func(msg, {args, client, config})
        }
    }
}