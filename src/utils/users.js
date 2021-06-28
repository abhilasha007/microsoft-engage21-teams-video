const users = [];

const addUser = ({userId, roomId}) => {
    const user = {userId, roomId}
    // console.log('user added', user);
    users.push(user);
    return { user };
}

const getUserById = (id) => {
    console.log(id);
    const user = users.find((user) => user.userId === id)
    return user
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.userId === id)
    
    if(index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUsersInRoom = (roomId) => {
    // room = room.trim().toLowerCase()
    const arr = []
    users.find((user) => {
        if(user.roomId === roomId) {
            arr.push(user)
        }
    })
    return arr;
}

module.exports = {
    addUser,
    getUserById
}