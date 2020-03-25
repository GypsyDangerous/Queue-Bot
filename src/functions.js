const formatDistanceToNow = require('date-fns/formatDistanceToNow');

const ArrayAny = (arr1, arr2) => arr1.some(v => arr2.indexOf(v) >= 0)

const hasPermission = (member, perms = [], roles = []) => {
        const memberRoles = member.roles.cache.array().map(r => r.id)
return ArrayAny(member.permissions.toArray(), perms) || ArrayAny(memberRoles, roles)
    }

const modWare = async (msg, {config, args}, cb) => {
    if (hasPermission(msg.member, config.ModPerms, config.ModRoles)) {
        cb(msg, {config, args})
    } else {
        await msg.reply("You don't have permission to use this command")
    }
}

class Function {
    constructor(func, description, usage, modOnly) {
        this.execute = modOnly ? (msg, { config, args }) => modWare(msg, {config, args}, func) : func
        this.description = description
        this.usage = usage
        this.modOnly = modOnly
    }
}

class QueueMember {
    constructor(member, { config }) {
        this.id = member.id
        this.isPriority = ArrayAny(member.roles.cache.array().map(role => role.id), config.priorityRoles)
        this.nickName = member.displayName
    }
}

QueueMember.prototype.toString = function memberToString() {
    return this.nickName
}



module.exports = {
    isNumeric: (value) => {
        return /^-?\d+[.\,]?\d*$/.test(value);
    },

    randomChoice: (arr) => {
        return arr[Math.floor(arr.length * Math.random())];
    },

    formatFromNow: (time) => formatDistanceToNow(time, { addSuffix: true }),

    capitalize: s => s.charAt(0).toUpperCase() + s.slice(1),
    ArrayAny,
    hasPermission,
    Function,
    QueueMember,
    modWare
}