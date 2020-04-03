
/*

mod only commands: start, stop, next

any user: join, status, leave

status: returns users position in the queue

*/

const {stripIndents} = require("common-tags")
const { MessageEmbed } = require("discord.js")
const { hasPermission, ArrayAny, Function, QueueMember } = require("../functions")
const path = require("path")
const fs = require("fs")

const configPath = path.join(__dirname, "..", "..", "config.json")
const Qpath = path.join(__dirname, "..", "..", "queue.json")


let qStatus = false
let queue = []
let current

const settings = require("./settings")

const toggleTalk = (current, {config}) => {
    current.voice.setChannel(config.QID)
    setTimeout(() => current.voice.setChannel(config.QnAId), 200)
}

const startHandler = async msg =>{
    if (!qStatus) {
        qStatus = true
        await msg.channel.send("Queue started!")
    } else {
        return await msg.channel.send("Queue already started!")
    }
}

const stopHandler = async msg => {
    qStatus = false
    await msg.channel.send("Queueing disabled, existing queue is saved")
}

const nextHandler = async (msg, {config}) => {
    if (current) {
        await current.roles.remove(config.QnATalkId)
        toggleTalk(current, {config})
    }
    current = queue.shift()
    if (current) {
        current = await msg.guild.members.fetch(current.id)
        const qnaChannel = msg.guild.channels
        if(qnaChannel.cache.array().find(ch => ch.id === config.QnAId).members.array().map(ch => ch.id).includes(current.id)){
            await current.roles.add(config.QnATalkId)
            await msg.channel.send(`${current.user} you are up!`)
            toggleTalk(current, {config})
        }else{
            msg.channel.send(`${current.user} you missed your turn because you weren't in the channel, feel free to rejoin the queue for another chance`)
            current = undefined
            nextHandler(msg, {config})
        }
    } else {
        msg.channel.send("No more users in the queue")
    }
}

const joinHandler = async (msg, {config}) => {
    if (qStatus) {
        const member = new QueueMember(msg.member, {config})
        if (queue.findIndex(current => current.id === member.id) >= 0) {
            return await msg.reply("You are already in the queue")
        } else {
            queue.push(member)
            await msg.reply(stripIndents`You have been added to the queue, your position is ${queue.indexOf(member) + 1}
                    beware when it is your turn there will be a sudden loud noise`)
        }
    }else{
        msg.channel.send("Queueing is currently disabled")
    }
}

const statusHandler = async msg => {
    const id = msg.author.id
    const index = queue.findIndex(member => member.id === id)
    if (index >= 0) {
        await msg.reply(`Your position in the queue is ${index + 1}`)
    } else if (current && current.id === id) {
        await msg.reply("You are currently being served")
    } else (
        await msg.reply("You are not in the queue")
    )
}

const resetHandler = async msg => {
    queue = []
    msg.channel.send(`The Queue has been cleared, Queueing is still ${qStatus ? "enabled" : "disabled"}`)
}

const memberHandler = async (msg, {config}) => {
    await msg.channel.send(`the current queue members are [${queue.map(member => member.nickName).slice(0, {config}.displayLimit).join(", ")}${queue.length > config.displayLimit ? " + " + (queue.length - config.displayLimit) : "" }], queueing is ${qStatus ? "enabled" : "disabled"}`)
}

const priorityHandler = async (msg, {config}) => {
    if(!qStatus){
        const priorityQueue = queue.filter(member => member.isPriority)
        const regularQueue = queue.filter(member => !member.isPriority)
        queue = [...priorityQueue, ...regularQueue]
        await msg.channel.send(`Queue priority filter complete`)
        await memberHandler(msg, {config})
    }else{
        await msg.channel.send("Queue priority filter cannot be done while Queueing is enabled")
    }
}

const help = async (msg, {args, config, functions}) => {
    if(args.length === 0){
        const available = hasPermission(msg.member, config.ModPerms, config.ModRoles) ? Object.keys(functions) : Object.keys(functions).filter(key => !functions[key].modOnly)
        const embed = new MessageEmbed()
            .setTitle("Queue system")
            .addField("Description", "This bot is used to manage a queue of users for a discord live event, this allows the moderators to easily control the users in the chat and only allow one user to speak at time")
            .addField("Commands", `The available commands are \`${available.join("`, `")}\``)
            .addField("Tips", ` - Some commands are moderator only\n - Run \`${config.prefix}q help <command>\` to get help on a specific command`)
            .setFooter("Queue Bot help")
        await msg.channel.send(embed)
    }else{
        const command = args.join(" ")
        const func = functions[command]
        if (Object.keys(functions).includes(command)){
            const embed = new MessageEmbed()
                .setTitle(args.join())
                .addField("Description", func.description)
                .addField("usage", {config}.prefix+func.usage, true)
                .addField("Moderator only", func.modOnly.toString(), true)
                .setFooter("Queue Bot help")
            await msg.channel.send(embed)
        }
    }
}

const leaveHandler = async (msg) => {
    if(queue.findIndex(member => member.id === msg.member.id) >= 0){
        queue = queue.filter(member => member.id !== msg.member.id)
        await msg.reply("You have been removed from the queue")
    }else{
        await msg.reply("You are not currently in the queue")
    }
}


const functions = {
    "start": new Function(startHandler, "Enables, queueing until stopped", "q start", true),
    "stop": new Function(stopHandler, "Disables queueing until started", "q stop", true),
    "next": new Function(nextHandler, "goes to the next user in the queue", "q next", true),
    "reset": new Function(resetHandler, "clears the queue", "q reset", true),
    "members": new Function(memberHandler, "returns a list of all the people in the queue and the queueing status", "q members", true),
    "priority": new Function(priorityHandler, "filters priority roles to the front of the queue", "q priority", true),
    "join": new Function(joinHandler, "join the queue if you are not already in it", "q join", false),
    "status": new Function(statusHandler, "returns your current position in the queue", "q status", false),
    "leave": new Function(leaveHandler, "removes the sender from the queue", "q leave", false),
    "help": new Function(help, "sends help messages for the general bot or specific commands", "q help", false),
    "settings": new Function(settings, "allows moderators to change settings on the fly", "q settings <setting> <value>", true)
}

functions.position = functions.status
functions.clear = functions.reset

module.exports = async (msg, {args, config}) => {
    const command = args.shift()
    const func = functions[command]
    try{
        if(Object.keys(functions).includes(command)) {
            const config = JSON.parse(fs.readFileSync(configPath)) // load the config file
            queue = JSON.parse(fs.readFileSync(Qpath)) // load the cached queue
            func.execute(msg, {args, config, functions}) // execute the function
            msg.channel.send(JSON.stringify(queue))
            fs.writeFileSync(Qpath, JSON.stringify(queue)) // write the queue to the cache
        }
    }catch(err){
        console.log(err)
        msg.channel.send("An error occured")
    }
}