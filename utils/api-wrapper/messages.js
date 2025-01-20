const APIMessages = {
    getMessages: async function (token, username, offset, limit) {

    },
    getMessageCount: async function (username) {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count`);
        const data = await res.json();
        return data.count;
    }
};

export default APIMessages;