const fs = require("fs")
const path = require("path")
const {stripIndents} = require("common-tags")

const configPath = path.join(__dirname, "..", "..", "config.json")

const available = {
    "setMain": "QnAId",
    "setTemp": "QID",
    "setTalkRole": "QnATalkId"
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
        msg.channel.send(JSON.stringify(config, null, 2))
    }
}