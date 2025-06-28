import { decode } from "html-entities";
import { parse } from "node-html-parser";
import consts from "./consts";
import fetch from "../fetch-provider";

const APIUser = {
    doesExist: async (username) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}`);
        return res.ok;
    },
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
    getProjects: async (username, offset = 0) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/projects?offset=${offset}&limit=20`);
        const data = await res.json();
        return data;
    },
    getFavorites: async (username, offset = 0) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/favorites?offset=${offset}&limit=20`);
        const data = await res.json();
        return data;
    },
    getCuratedStudios: async (username, offset = 0) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/studios/curate?offset=${offset}&limit=20`);
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
    getActivity: async (username, max = 50) => {
        const userFetch = await fetch(`https://api.scratch.mit.edu/users/${username}`, {
            headers: {
                "User-Agent": consts.UserAgent,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        });
        const user = await userFetch.json();
        const activityFetch = await fetch(`https://scratch.mit.edu/messages/ajax/user-activity/?user=${username}&max=${max}`, {
            headers: {
                "Content-Type": "text/html",
                "User-Agent": consts.UserAgent,
                "Accept": "text/html",
                "Referer": `https://scratch.mit.edu/users/${username}/`,
            }
        });
        const activityHTML = await activityFetch.text();
        let dom = parse(activityHTML);
        dom = dom.querySelectorAll("li");
        let events = [];
        for (let i = 0; i < dom.length; i++) {
            let obj = {
                id: Math.floor(Math.random() * 10000000),
            };
            const selected = dom[i].querySelector("div");
            obj.actor_username = username;
            obj.actor_id = user.id;
            obj.datetime_created = dom[i].querySelector(".time").innerText;
            switch (
            selected.childNodes[2].innerText.replace(/\s+/g, " ").trim()
            ) {
                case "became a curator of": {
                    obj.type = "becomecurator";
                    obj.title = decode(selected.childNodes[3].innerText);
                    break;
                }
                case "added": {
                    obj.type = "addproject";
                    obj.title = decode(selected.childNodes[3].innerText);
                    obj.project_id = Number(
                        selected.childNodes[3].getAttribute("href").split("/")[2]
                    );
                    obj.gallery_title = selected.childNodes[5].innerText;
                    break;
                }
                case "shared the project": {
                    obj.type = "shareproject";
                    obj.title = decode(selected.childNodes[3].innerText);
                    obj.project_id = Number(
                        selected.childNodes[3].getAttribute("href").split("/")[2]
                    );
                    break;
                }
                case "loved": {
                    obj.type = "loveproject";
                    obj.title = decode(selected.childNodes[3].innerText);
                    obj.project_id = Number(
                        selected.childNodes[3].getAttribute("href").split("/")[2]
                    );
                    break;
                }
                case "favorited": {
                    obj.type = "favoriteproject";
                    obj.project_title = decode(selected.childNodes[3].innerText);
                    obj.project_id = Number(
                        selected.childNodes[3].getAttribute("href").split("/")[2]
                    );
                    break;
                }
                case "is now following": {
                    obj.type = "followuser";
                    obj.followed_username = selected.childNodes[3].innerText;
                    break;
                }
                case "was promoted to manager of": {
                    obj.type = "becomeownerstudio";
                    obj.recipient_id = obj.actor_id;
                    obj.recipient_username = username;
                    delete obj.actor_id;
                    delete obj.actor_username;
                    obj.gallery_title = decode(selected.childNodes[3].innerText);
                    obj.gallery_id = Number(
                        selected.childNodes[3].getAttribute("href").split("/")[2]
                    );
                }
            }
            events.push(obj);
        }
        return events;
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
            },
            body: ""
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
            },
            body: ""
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
                Accept: "text/plain",
                'Content-Type': 'text/plain; charset=UTF-8',
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
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
    deleteComment: async (username, commentID, csrf, token) => {
        const req = await fetch(`https://scratch.mit.edu/site-api/comments/user/${username}/del/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrf,
                "X-Token": token,
                "x-requested-with": "XMLHttpRequest",
                Referer: `https://scratch.mit.edu/`,
                "User-Agent": consts.UserAgent,
                Accept: "*/*",
                Origin: "https://scratch.mit.edu",
                "Cache-Control": "max-age=0, no-cache",
                Pragma: "no-cache",
            },
            body: JSON.stringify({
                id: commentID
            })
        });
        if (req.ok) {
            return true;
        } else {
            console.warn(req.status)
            console.warn(await req.text())
            return false;
        }
    }
}

export default APIUser;