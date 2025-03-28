const APIMessages = {
    /**
     * @param {String} token 
     * @param {String} username 
     * @param {Number} offset 
     * @param {"comments"|"project"|"studios"|"forums"} filter 
     * @returns 
     */
    getMessages: async function (username, token, offset = 0, filter = "", limit = 30) {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/messages?offset=${offset}&filter=${filter}&limit=30`, {
            headers: {
                "x-token": token
            }
        });
        const data = await res.json();
        return data;
    },
    getMessageCount: async function (username) {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count?cacheBust=${Date.now()}`);
        const data = await res.json();
        return data.count;
    }
};

export default APIMessages;