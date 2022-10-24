var axios = require('axios');

const harperSaveMessage = async (message, userName, room, __createdtime__) => {
    const dbUrl = process.env.HARPERDB_URL;
    const dbPw = process.env.HARPERDB_PW;
    if(!dbPw || !dbPw) return null;

    var data = JSON.stringify({
        "operation": "insert",
        "schema": "messages",
        "table": "messages",
        records: [
            {
                message,
                userName,
                room,
                __createdtime__
            }
        ]
    })
    var config = {
        method: 'POST',
        url: dbUrl,
        headers: {
            'Content-type': "application/json",
            "Authorization": dbPw
        },
        data: data
    }
    return await axios(config);
}


const harperGetMessages = async (room) => {
    const dbUrl = process.env.HARPERDB_URL;
    const dbPw = process.env.HARPERDB_PW;
    if(!dbUrl || !dbPw) return null;
    let data = JSON.stringify({
        "operation": "sql",
        "sql": `Select * from messages.messages Where room = '${room}' LIMIT 100`,
    })
    let config = {
        method: 'POST',
        url: dbUrl,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': dbPw
        },
        data: data
    }

    return await axios(config);
}
module.exports = {harperSaveMessage, harperGetMessages}