
const qHandler = require("./qHandler")



const functions =  {
        "q": qHandler,
    }


module.exports = (msg, client, config) => {
    if(msg.author.bot) return
    
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