const users = []

const addUser = ({userId, roomId}) => {
    //clean the data // username
    // username = username.trim().toLowerCase()
    // room = room.trim().toLowerCase()

    //Validate the data
    // if(!username || !room) {
    //     return {
    //         error : 'Username and room are required!'
    //     }
    // }

    // Check for exisiting user
    // const exisitingUser = users.find((user) => {
    //     return user.room === room && user.username === username
    // })

    // Validate username
    // if(exisitingUser) {
    //     return {
    //         error: 'Username is already in use! Try another one.'
    //     }
    // }

    // Store user
    // const user = {id, username, room}
    const user = {userId, roomId}
    users.push(user)
    return { user }
}

module.exports = {
    addUser
}