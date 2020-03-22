
/*

mod only commands: start, stop, next

any user: join, status, leave

status: returns users position in the queue

*/

const {stripIndents} = require("common-tags")
const { MessageEmbed } = require("discord.js")

let qStatus = false
const queue = []
let current

class Function {
    constructor(func, description, usage, modOnly) {
        this.execute = modOnly ? (msg, { config }) => modWare(msg, config, func) : func
        this.description = description
        this.usage = usage
        this.modOnly = modOnly
    }
}

class QueueMember {
    constructor(member, config){
        this.id = member.id
        this.isPriority = member.roles.cache.array().map(role => role.id).includes(config.priorityRole)
        this.nickName = member.displayName
    }
}


const modWare = (msg, config, cb) => {
    if(msg.member.permissions.any(config.ModPerms)){
        cb(msg, config)
    }else{
        msg.reply("You don't have permission to use this command")
    }
}

const toggleTalk = (current, config) => {
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

const nextHandler = async (msg, config) => {
    if (current) {
        await current.roles.remove(config.QnATalkId)
        toggleTalk(current, config)
    }
    current = queue.shift()
    if (current) {
        current = await msg.guild.members.fetch(current.id)
        const qnaChannel = msg.guild.channels
        if(qnaChannel.cache.array().find(ch => ch.id === config.QnAId).members.array().map(ch => ch.id).includes(current.id)){
            await current.roles.add(config.QnATalkId)
            await msg.channel.send(`${current.user} you are up!`)
            toggleTalk(current, config)
        }else{
            msg.channel.send(`${current.user} you missed your turn because you weren't in the channel, feel free to rejoin the queue for another chance`)
            current = undefined
            nextHandler(msg, config)
        }
    } else {
        msg.channel.send("No more users in the queue")
    }
}

const joinHandler = async (msg, config) => {
    if (qStatus) {
        const member = new QueueMember(msg.member, config)
        if (queue.includes(member)) {
            return await msg.reply("You are already in the queue")
        } else {
            queue.push(member)
            await msg.reply(stripIndents`You have been added to the queue, your position is ${queue.indexOf(member) + 1}
                    beware when it is your turn there will be a sudden loud noise`)
        }
    }
}

const statusHandler = async msg => {
    const id = msg.author.id
    if (queue.includes(id)) {
        await msg.reply(`Your position in the queue is ${queue.indexOf(id) + 1}`)
    } else if (current.user.id === id) {
        await msg.reply("You are currently being served")
    } else (
        await msg.reply("You are not in the queue")
    )
}

const resetHandler = async msg => {
    queue = []
    msg.channel.send("The Queue has been Cleared, Queueing is still enabled")
}

const memberHandler = async msg => {
    const members = queue.map(member => member.nickName)
    msg.channel.send(`the current queue members are [${members.join(", ")}], queuing is ${qStatus ? "enabled" : "disabled"}`)
}

// TODO Finish
const priorityHandler = async (msg, config) => {
    //data.sort(function (x, y) { return x == first ? -1 : y == first ? 1 : 0; });
    if(!qStatus){
        queue.sort(member => member.isPriority ? 1 : -1)
        msg.channel.send(`Queue priority filter complete the queue is [${queue.map(member => member.nickName).join(", ")}]`)
    }else{
        msg.channel.send("Queue priority filter cannot be done while Queuing is enabled")
    }
}

const help = (msg, {args, config, functions}) => {
    if(args.length === 0){
        const available = (msg.member.permissions.any(config.ModPerms)) ? Object.keys(functions) : Object.keys(functions).filter(key => !functions[key].modOnly)
        console.log(available)
        const embed = new MessageEmbed()
            .setTitle("Queue system")
            .addField("Description", "This bot is used to manage a queue of users for a discord live event, this allows the moderators to easily control the users in the chat and only allow one user to speak at time")
            .addField("Commands", `The available commands are \`${available.join("`, `")}\``)
            .addField("Tips", ` - Some commands are moderator only\n - Run \`${config.prefix}q help <command>\` to get help on a specific command`)
            .setFooter("Queue Bot help")
        msg.channel.send(embed)
    }else{
        const command = args.join(" ")
        const func = functions[command]
        if (Object.keys(functions).includes(command)){
            const embed = new MessageEmbed()
                .setTitle(args.join())
                .addField("Description", func.description)
                .addField("usage", config.prefix+func.usage, true)
                .addField("Moderator only", func.modOnly.toString(), true)
                .setFooter("Queue Bot help")
            msg.channel.send(embed)
        }
    }
}


const functions = {
    "start": new Function(startHandler, "Enables, queuing until stopped", "q start", true),
    "stop": new Function(stopHandler, "Disables queuing until started", "q stop", true),
    "next": new Function(nextHandler, "goes to the next user in the queue", "q next", true),
    "reset": new Function(resetHandler, "clears the queue", "q reset", true),
    "members": new Function(memberHandler, "returns a list of all the people in the queue and the queuing status", "q members", true),
    "priority": new Function(priorityHandler, "filters priority roles to the front of the queue 'Incomplete'", "q priority", true),
    "join": new Function(joinHandler, "join the queue if you are not already in it", "q join", false),
    "status": new Function(statusHandler, "returns your current position in the queue", "q status", false),
    "help": new Function(help, "sends help messages for the general bot or specific commands", "q help", false)
}

functions.position = functions.status



module.exports = async (msg, {args, config}) => {
    const command = args.shift()
    const func = functions[command]
    if(Object.keys(functions).includes(command)){
        func.execute(msg, {args, config, functions})
    }
}