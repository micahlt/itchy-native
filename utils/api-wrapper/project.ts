import consts from "./consts";
import fetch from "../fetch-provider";
import { ProjectInteractions, Comment } from "./types/project";

const APIProject = {
  getProject: async (id: string | number): Promise<any> => {
    const res = await fetch(`https://api.scratch.mit.edu/projects/${id}`);
    const data = await res.json();
    return data;
  },
  getInteractions: async (
    id: string | number,
    username: string,
    token: string
  ): Promise<ProjectInteractions> => {
    const opts = {
      headers: {
        "User-Agent": consts.UserAgent,
        Accept: "application/json",
        "Accept-Language": "en, en;q=0.8",
        "X-Token": token,
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "https://scratch.mit.edu",
        Referer: "https://scratch.mit.edu/",
      },
      referrer: `https://scratch.mit.edu/projects/${id}`,
    };
    const love = await fetch(
      `https://api.scratch.mit.edu/projects/${id}/loves/user/${username}`,
      opts
    );
    const favorite = await fetch(
      `https://api.scratch.mit.edu/projects/${id}/favorites/user/${username}`,
      opts
    );

    const loved = await love.json();
    const favorited = await favorite.json();

    return {
      loved: loved.userLove,
      favorited: favorited.userFavorite,
    };
  },
  setInteraction: async (
    interaction: "loves" | "favorites",
    value: boolean = true,
    id: string | number,
    username: string,
    token: string,
    csrf: string,
    cookie?: string
  ): Promise<ProjectInteractions> => {
    const opts = {
      headers: {
        "X-CSRFToken": csrf,
        "X-Token": token,
        "x-requested-with": "XMLHttpRequest",
        Referer: `https://scratch.mit.edu/projects/${id}/`,
        "User-Agent": consts.UserAgent,
        Accept: "application/json",
        "Content-Length": "0",
        Origin: "https://scratch.mit.edu",
        "Cache-Control": "max-age=0, no-cache",
        Pragma: "no-cache",
      },
      referrer: `https://scratch.mit.edu/projects/${id}`,
      method: value === true ? "POST" : "DELETE",
      body: value === true ? "" : undefined,
    };

    const res = await fetch(
      `https://api.scratch.mit.edu/proxy/projects/${id}/${interaction}/user/${username}`,
      opts
    );
    const data = await res.json();
    return data;
  },
  getComments: async (
    projectID: string | number,
    author: string,
    limit: number = 20,
    offset: number = 0,
    includeReplies: boolean = true
  ): Promise<Comment[]> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${author}/projects/${projectID}/comments?offset=${offset}&limit=${limit}`
    );
    const data = await res.json();
    if (includeReplies) {
      const commentPromises = data.map(async (comment: Comment) => {
        const replies = await APIProject.getCommentReplies(
          projectID,
          author,
          comment?.id
        );
        comment.replies = replies;
        comment.includesReplies = true;
        return comment;
      });

      const settledComments = await Promise.allSettled(commentPromises);
      return settledComments
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter(Boolean);
    } else {
      return data;
    }
  },
  getCommentReplies: async (
    projectID: string | number,
    author: string,
    parentCommentID?: string
  ): Promise<Comment[]> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${author}/projects/${projectID}/comments/${parentCommentID}/replies`
    );
    const data = await res.json();
    return data;
  },
  postComment: async (
    projectID: string | number,
    content: string = "",
    csrf: string,
    token: string,
    parentID: string = "",
    commentee: string = ""
  ): Promise<string> => {
    const opts = {
      headers: {
        "X-CSRFToken": csrf,
        "X-Token": token,
        "x-requested-with": "XMLHttpRequest",
        Referer: `https://scratch.mit.edu/`,
        "User-Agent": consts.UserAgent,
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: "https://scratch.mit.edu",
        TE: "trailers",
        "Cache-Control": "max-age=0, no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
      },
      referrer: `https://scratch.mit.edu/`,
      method: "POST",
      body: JSON.stringify({
        content: content,
        parent_id: parentID,
        commentee_id: commentee,
      }),
    };

    const res = await fetch(
      `https://api.scratch.mit.edu/proxy/comments/project/${projectID}`,
      opts
    );
    const data = await res.json();
    if (!data?.id || !res.ok) {
      throw new Error(JSON.stringify(data));
    }
    return data.id;
  },
  deleteComment: async (
    projectID: string | number,
    commentID: string,
    csrf: string,
    token: string
  ): Promise<boolean> => {
    const opts = {
      headers: {
        "X-CSRFToken": csrf,
        "X-Token": token,
        "x-requested-with": "XMLHttpRequest",
        Referer: `https://scratch.mit.edu/`,
        "User-Agent": consts.UserAgent,
        Accept: "*/*",
        Origin: "https://scratch.mit.edu",
        TE: "trailers",
        "Cache-Control": "max-age=0, no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
      },
      referrer: `https://scratch.mit.edu/`,
      method: "DELETE",
    };

    const res = await fetch(
      `https://api.scratch.mit.edu/proxy/comments/project/${projectID}/comment/${commentID}`,
      opts
    );
    return res.status === 200;
  },
};

export default APIProject;
