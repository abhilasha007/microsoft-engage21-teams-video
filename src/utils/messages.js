const generateMessage = (userId, msg) => {
    return {
        userId,
        msg : msg,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage
}