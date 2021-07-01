const generateMessage = (userId, msg, username) => {
    return {
        userId,
        username,
        msg : msg,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage
}