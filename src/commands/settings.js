const fs = require("fs")
const path = require("path")
const {stripIndents} = require("common-tags")
const { MessageEmbed } = require("discord.js")

const configPath = path.join(__dirname, "..", "..", "config.json")

const available = {
    "setMain": "QnAId",
    "setTemp": "QID",
    "setTalkRole": "QnATalkId"
}

const embedJSON = (obj, title = "") => {
    const embed = new MessageEmbed()
        .setTitle(title)
        .setFooter("JSON embedded")
    for (const key of Object.keys(obj)) {
        const value = obj[key]
        if (value instanceof Array) {
            embed.addField(key, value.join("\n"), true)
        } else {
            embed.addField(key, value, true)
        }
    }
    return embed
}

module.exports = async (msg, {args, config}) => {
    console.log
    const command = args.shift()
    const value = args.join(" ")
    const setting = available[command]
    if(Object.keys(available).includes(command)){
        config[setting] = value
        fs.writeFileSync(configPath, JSON.stringify(config))
    }else if(command === "help"){
        msg.channel.send(stripIndents`The available settings are \`${Object.keys(available).join("`, `")}\`
        
        All settings must be set to id's not names`)
    }else if(!command){
        msg.channel.send(embedJSON(config, "Settings"))
    }
}