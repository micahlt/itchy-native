import { decode } from "html-entities";
import { parse } from "node-html-parser";
import consts from "./consts";
const APIUser = {
    getCompleteProfile: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}`);
        const featured = await fetch(`https://scratch.mit.edu/site-api/users/all/${username}`);
        const follower = await fetch(`https://scratch.mit.edu/users/${username}/followers/`);
        const following = await fetch(`https://scratch.mit.edu/users/${username}/following/`);

        const data = await res.json();
        const featuredProject = await featured.json();
        const followersHTML = follower.ok ? await follower.text() : "Followers (-1)";
        const followingHTML = following.ok ? await following.text() : "Following (-1)";

        return {
            ...data,
            featuredProject: featuredProject.featured_project_data ? {
                label: featuredProject.featured_project_label_name,
                title: featuredProject.featured_project_data?.title,
                thumbnail_url: featuredProject.featured_project_data?.thumbnail_url,
                id: featuredProject.featured_project_data?.id,
            } : null,
            followers: Number(followersHTML.match(/Followers \((-?\d*)\)/g)[0].split("(")[1].split(")")[0]),
            following: Number(followingHTML.match(/Following \((-?\d*)\)/g)[0].split("(")[1].split(")")[0])
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
    getCuratedStudios: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/studios/curate`);
        const data = await res.json();
        return data;
    },
    getComments: async (username, page = 1) => {
        // Algorithm taken from https://github.com/webdev03/meowclient
        const res = await fetch(`https://scratch.mit.edu/site-api/comments/user/${username}/?page=${page}&cacheBust=${Date.now()}`, {
            headers: {
                "Cache-Control": "no-cache",
                "User-Agent": consts.UserAgent,
                Pragma: "no-cache",
            }
        });
        const commentHTML = await res.text();
        const dom = parse(commentHTML);
        const items = dom.querySelectorAll(".top-level-reply");
        let comments = [];
        for (let elID in items) {
            const element = items[elID];
            if (typeof element == "function") break;
            const commentID = element.querySelector(".comment").id;
            const parentCommentID = commentID;
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
                    parentID: parentCommentID,
                    content: decode(commentContent),
                    author: {
                        username: commentPoster,
                        image: `https:${posterImage}`
                    },
                    datetime_created: new Date(commentTime),
                    includesReplies: true
                });
            }

            comments.push({
                id: commentID,
                content: decode(commentContent),
                replies: replies,
                author: {
                    username: commentPoster,
                    image: `https:${posterImage}`
                },
                datetime_created: new Date(commentTime),
                includesReplies: true
            });
        }
        if (comments.length == 0) {
            return [];
        }
        return comments;
    },
    getFollowers: async (username, page) => {
        const followers = await fetch(`https://scratch.mit.edu/users/${username}/followers/?page=${page}`);
        const dom = parse(await followers.text());
        const items = dom.querySelectorAll(".user");
        let followersList = [];
        for (let element of items) {
            const user = {
                profile: {
                    images: {}
                }
            };
            user.username = element.querySelector(".title").textContent.trim();
            followersList.push(user);
            user.profile.images["60x60"] = element.querySelector("img").getAttribute("data-original");
            user.id = user.profile.images["60x60"].match(/(?!get_image\/user\/)(\d+|default)(?=_)+/g)[0]
            if (user.id === "default")
                user.id = null;
        }
        return followersList;
    },
    getFollowing: async (username, page) => {
        const following = await fetch(`https://scratch.mit.edu/users/${username}/following/?page=${page}`);
        const dom = parse(await following.text());
        const items = dom.querySelectorAll(".user");
        let followingList = [];
        for (let element of items) {
            const user = {
                profile: {
                    images: {}
                }
            };
            user.username = element.querySelector(".title").textContent.trim();
            followingList.push(user);
            user.profile.images["60x60"] = element.querySelector("img").getAttribute("data-original");
            user.id = user.profile.images["60x60"].match(/(?!get_image\/user\/)(\d+|default)(?=_)+/g)[0]
            if (user.id === "default")
                user.id = null;
        }
        return followingList;
    },
    amIFollowing: async (username) => {
        const user = await fetch(`https://scratch.mit.edu/users/${username}/`);
        const dom = parse(await user.text());
        if (!!dom.querySelector("[data-control='unfollow']")) {
            return true;
        } else if (!!dom.querySelector("[data-control='follow']")) {
            return false;
        } else {
            return undefined;
        }
    },
    follow: async (usernameToFollow, myUsername, csrf) => {
        const req = await fetch(`https://scratch.mit.edu/site-api/users/followers/${usernameToFollow}/add/?usernames=${myUsername}`, {
            method: "PUT",
            headers: {
                "X-CSRFToken": csrf,
                "x-requested-with": "XMLHttpRequest",
                Referer: `https://scratch.mit.edu/users/${usernameToFollow}/`,
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                "Content-Length": "0",
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
                "Accept-Encoding": "gzip, deflate, br"
            },
        });
        if (req.ok) {
            return true;
        } else {
            return false;
        }
    },
    unfollow: async (usernameToUnfollow, myUsername, csrf) => {
        const req = await fetch(`https://scratch.mit.edu/site-api/users/followers/${usernameToUnfollow}/remove/?usernames=${myUsername}`, {
            method: "PUT",
            headers: {
                "X-CSRFToken": csrf,
                "x-requested-with": "XMLHttpRequest",
                Referer: `https://scratch.mit.edu/users/${usernameToUnfollow}/`,
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                "Content-Length": "0",
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
                "Accept-Encoding": "gzip, deflate, br"
            },
        });
        if (req.ok) {
            return true;
        } else {
            return false;
        }
    },
    postComment: async (username, content = "", csrf, parentID = "", commentee = "") => {
        const req = await fetch(`https://scratch.mit.edu/site-api/comments/user/${username}/add/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrf,
                "x-requested-with": "XMLHttpRequest",
                Referer: `https://scratch.mit.edu/users/${username}/`,
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
                "Accept-Encoding": "gzip, deflate, br"
            },
            body: JSON.stringify({
                content: content,
                parent_id: parentID,
                commentee_id: commentee,
            })
        });
        if (req.ok) {
            const t = await req.text();
            return /data-comment-id="(\d+)"/g.exec(t)[1];
        } else {
            return false;
        }
    },
    deleteComment: async (username, commentID, csrf) => {
        const req = await fetch(`https://scratch.mit.edu/site-api/comments/user/${username}/add/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrf,
                "x-requested-with": "XMLHttpRequest",
                Referer: `https://scratch.mit.edu/users/${username}/`,
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
                "Accept-Encoding": "gzip, deflate, br"
            },
            body: JSON.stringify({
                id: commentID
            })
        });
        if (req.ok) {
            return true;
        } else {
            return false;
        }
    }
}

export default APIUser;