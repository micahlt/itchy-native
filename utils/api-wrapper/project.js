import consts from "./consts";

const APIProject = {
    getProject: async (id) => {
        const res = await fetch(`https://api.scratch.mit.edu/projects/${id}`);
        const data = await res.json();
        return data;
    },
    getInteractions: async (id, username, token) => {
        const opts = {
            headers: {
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                "Accept-Language": "en, en;q=0.8",
                "X-Token": token,
                Pragma: "no-cache",
                "Cache-Control": "no-cache",
                Origin: "https://scratch.mit.edu",
                Referer: "https://scratch.mit.edu/"
            },
            referrer: `https://scratch.mit.edu/projects/${id}`
        };
        const love = await fetch(`https://api.scratch.mit.edu/projects/${id}/loves/user/${username}`, opts);
        const favorite = await fetch(`https://api.scratch.mit.edu/projects/${id}/favorites/user/${username}`, opts);

        const loved = await love.json();
        const favorited = await favorite.json();

        return {
            loved: loved.userLove,
            favorited: favorited.userFavorite
        }
    },
    setInteraction: async (interaction, value = true, id, username, token, csrf, cookie) => {
        const opts = {
            headers: {
                "X-CSRFToken": csrf,
                "X-Token": token,
                "x-requested-with": "XMLHttpRequest",
                Cookie: cookie,
                Referer: `https://scratch.mit.edu/projects/${id}/`,
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                "Content-Length": "0",
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
                "Accept-Encoding": "gzip, deflate, br"
            },
            referrer: `https://scratch.mit.edu/projects/${id}`,
            method: value === true ? "POST" : "DELETE"
        };

        const res = await fetch(`https://api.scratch.mit.edu/proxy/projects/${id}/${interaction}/user/${username}`, opts);
        const data = await res.json();
        return data;
    },
    getComments: async (projectID, author, limit = 20, offset = 0, includeReplies = true) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${author}/projects/${projectID}/comments?offset=${offset}&limit=${limit}`);
        const data = await res.json();
        if (includeReplies) {
            let commentArr = [];
            await Promise.allSettled(data.map(async (comment) => {
                const replies = await APIProject.getCommentReplies(projectID, author, comment.id);
                comment.replies = replies;
                comment.includesReplies = true;
                commentArr.push(comment);
            }));
            return commentArr;
        } else {
            return data;
        }
    },
    getCommentReplies: async (projectID, author, parentCommentID) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${author}/projects/${projectID}/comments/${parentCommentID}/replies`);
        const data = await res.json();
        return data;
    }
}

export default APIProject;