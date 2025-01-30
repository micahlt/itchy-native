const APIStudio = {
    getStudio: async (id) => {
        const res = await fetch(`https://api.scratch.mit.edu/studios/${id}`);
        const data = await res.json();
        return data;
    },
    getProjects: async (id) => {
        const res = await fetch(`https://api.scratch.mit.edu/studios/${id}/projects`);
        const data = await res.json();
        return data;
    },
    getComments: async (id, offset = 0, limit = 20, includeReplies = true) => {
        const res = await fetch(`https://api.scratch.mit.edu/studios/${id}/comments?offset=${offset}&limit=${limit}`, {
            headers: {
                Referer: "https://scratch.mit.edu"
            }
        });
        const data = await res.json();
        if (includeReplies) {
            let commentArr = [];
            await Promise.allSettled(data.map(async (comment) => {
                const replies = await APIStudio.getCommentReplies(id, comment.id);
                comment.replies = replies || [];
                comment.includesReplies = true;
                commentArr.push(comment);
            }));
            return commentArr;
        } else {
            return data;
        }
    },
    getCommentReplies: async (id, parentCommentID) => {
        const res = await fetch(`https://api.scratch.mit.edu/studios/${id}/comments/${parentCommentID}/replies`);
        const data = await res.json();
        return data;
    }
}

export default APIStudio;