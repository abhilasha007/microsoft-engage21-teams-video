const generateMessage = (msg, username) => {
    return {
        username,
        msg : msg,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage
}