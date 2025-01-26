import { decode } from "html-entities";
import { parse } from "node-html-parser";
const APIUser = {
    getCompleteProfile: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}`);
        const featured = await fetch(`https://scratch.mit.edu/site-api/users/all/${username}`);
        const follower = await fetch(`https://scratch.mit.edu/users/${username}/followers/`);
        const following = await fetch(`https://scratch.mit.edu/users/${username}/following/`);

        const data = await res.json();
        const featuredProject = await featured.json();
        const followersHTML = await follower.text();
        const followingHTML = await following.text();

        return {
            ...data,
            featuredProject: {
                label: featuredProject.featured_project_label_name,
                title: featuredProject.featured_project_data.title,
                thumbnail_url: featuredProject.featured_project_data.thumbnail_url,
                id: featuredProject.featured_project_data.id,
            },
            followers: followersHTML.match(/Followers \((\d*)\)/g)[0].split("(")[1].split(")")[0],
            following: followingHTML.match(/Following \((\d*)\)/g)[0].split("(")[1].split(")")[0]
        };
    },
    getProfile: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}`);
        const data = await res.json();
        return data;
    },
    getProjects: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/projects`);
        const data = await res.json();
        return data;
    },
    getFavorites: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/favorites`);
        const data = await res.json();
        return data;
    },
    getComments: async (username, page = 1) => {
        // Algorithm taken from https://github.com/webdev03/meowclient
        const res = await fetch(`https://scratch.mit.edu/site-api/comments/user/${username}/?page=${page}`);
        const commentHTML = await res.text();
        const dom = parse(commentHTML);
        const items = dom.querySelectorAll(".top-level-reply");
        let comments = [];
        for (let elID in items) {
            const element = items[elID];
            if (typeof element == "function") break;
            const commentID = element.querySelector(".comment").id;
            const commentPoster = element
                .querySelector(".comment")
                .getElementsByTagName("a")[0]
                .getAttribute("data-comment-user");
            const commentContent = element
                .querySelector(".comment")
                .querySelector(".info")
                .querySelector(".content")
                .innerHTML.trim();
            const commentTime = element
                .querySelector(".time")
                .getAttribute("title");
            const posterImage = element
                .querySelector("img.avatar")
                .getAttribute("src");

            // get replies
            let replies = [];
            let replyList = element
                .querySelector(".replies")
                .querySelectorAll(".reply");
            for (let replyID in replyList) {
                const reply = replyList[replyID];
                if (reply.tagName === "A") continue;
                if (typeof reply === "function") continue;
                if (typeof reply === "number") continue;
                const commentID = reply.querySelector(".comment").id;
                const commentPoster = reply
                    .querySelector(".comment")
                    .getElementsByTagName("a")[0]
                    .getAttribute("data-comment-user");

                // regex here developed at https://scratch.mit.edu/discuss/post/5983094/
                const commentContent = reply
                    .querySelector(".comment")
                    .querySelector(".info")
                    .querySelector(".content")
                    .textContent.trim()
                    .replace(/\n+/gm, "")
                    .replace(/\s+/gm, " ");
                const commentTime = reply
                    .querySelector(".time")
                    .getAttribute("title");
                const posterImage = reply
                    .querySelector("img.avatar")
                    .getAttribute("src");

                replies.push({
                    id: commentID,
                    username: commentPoster,
                    content: decode(commentContent),
                    apiID: commentID.substring(9),
                    avatarURL: `https:${posterImage}`,
                    time: new Date(commentTime)
                });
            }

            comments.push({
                id: commentID,
                username: commentPoster,
                content: decode(commentContent),
                apiID: commentID.substring(9),
                replies: replies,
                avatarURL: `https:${posterImage}`,
                time: new Date(commentTime)
            });
        }
        if (comments.length == 0) {
            return [];
        }
        return comments;
    },
}

export default APIUser;