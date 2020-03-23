const formatDistanceToNow = require('date-fns/formatDistanceToNow');

const ArrayAny = (arr1, arr2) => arr1.some(v => arr2.indexOf(v) >= 0)

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
    hasPermission: (member, perms) => {
        return ArrayAny(member.permissions.toArray(), perms)
    }
}