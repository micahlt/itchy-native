import consts from "./consts";
import fetch from "../fetch-provider";
import {
  APIStudio as APIStudioType,
  Studio,
  StudioActivity,
} from "./types/studio";
import { Project } from "./types/project";

const APIStudio: APIStudioType = {
  getStudio: async (id: string | number): Promise<Studio> => {
    const res = await fetch(`https://api.scratch.mit.edu/studios/${id}`);
    const data = await res.json();
    return data;
  },
  getProjects: async (
    id: string | number,
    offset: number = 0,
    limit: number = 20
  ): Promise<Project[]> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/studios/${id}/projects?offset=${offset}&limit=${limit}`
    );
    const data = await res.json();
    return data;
  },
  getActivity: async (
    id: string | number,
    offset: number = 0,
    limit: number = 20
  ): Promise<StudioActivity[]> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/studios/${id}/activity?offset=${offset}&limit=${limit}`
    );
    const data = await res.json();
    return data;
  },
  getComments: async (
    id: string | number,
    offset: number = 0,
    limit: number = 20,
    includeReplies: boolean = true
  ): Promise<any> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/studios/${id}/comments?offset=${offset}&limit=${limit}`,
      {
        headers: {
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
      }
    );
    let data = await res.json();
    if (includeReplies) {
      let commentPromises = data.map(async (comment: any) => {
        const replies = await APIStudio.getCommentReplies(id, comment.id);
        comment.replies = replies || [];
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
    id: string | number,
    parentCommentID: string
  ): Promise<any> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/studios/${id}/comments/${parentCommentID}/replies`,
      {
        headers: {
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
      }
    );
    const data = await res.json();
    return data;
  },
  postComment: async (
    studioID: string | number,
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
      `https://api.scratch.mit.edu/proxy/comments/studio/${studioID}`,
      opts
    );
    const data = await res.json();
    return data.id;
  },
  deleteComment: async (
    studioID: string | number,
    commentID: string,
    csrf: string,
    token: string
  ): Promise<boolean> => {
    const opts = {
      headers: {
        "X-CSRFToken": csrf,
        "X-Token": token,
        "x-requested-with": "XMLHttpRequest",
        Referer: `https://scratch.mit.edu/studios/${studioID}/comments`,
        "User-Agent": consts.UserAgent,
        Accept: "application/json",
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
      `https://api.scratch.mit.edu/proxy/comments/studio/${studioID}/comment/${commentID}`,
      opts
    );
    return res.status === 200;
  },
  getRelationship: async (
    username: string,
    studioID: string | number,
    token: string
  ): Promise<any> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/studios/${studioID}/users/${username}`,
      {
        headers: {
          "User-Agent": consts.UserAgent,
          Accept: "application/json",
          Pragma: "no-cache",
          "Cache-Control": "max-age=0, no-cache",
          "X-Token": token,
          "x-requested-with": "XMLHttpRequest",
        },
      }
    );
    return await res.json();
  },
  follow: async (
    studioID: string | number,
    myUsername: string,
    csrf: string
  ): Promise<boolean> => {
    const req = await fetch(
      `https://scratch.mit.edu/site-api/users/bookmarkers/${studioID}/add/?usernames=${myUsername}`,
      {
        method: "PUT",
        headers: {
          "X-CSRFToken": csrf,
          "x-requested-with": "XMLHttpRequest",
          Referer: `https://scratch.mit.edu/studios/${studioID}/`,
          "User-Agent": consts.UserAgent,
          Accept: "*/*",
          "Content-Length": "0",
          Origin: "https://scratch.mit.edu",
          "Cache-Control": "max-age=0, no-cache",
          Pragma: "no-cache",
        },
        body: "",
      }
    );
    if (req.ok) {
      return true;
    } else {
      return false;
    }
  },
  unfollow: async (
    studioID: string | number,
    myUsername: string,
    csrf: string
  ): Promise<boolean> => {
    const req = await fetch(
      `https://scratch.mit.edu/site-api/users/bookmarkers/${studioID}/remove/?usernames=${myUsername}`,
      {
        method: "PUT",
        headers: {
          "X-CSRFToken": csrf,
          "x-requested-with": "XMLHttpRequest",
          Referer: `https://scratch.mit.edu/studios/${studioID}/`,
          "User-Agent": consts.UserAgent,
          Accept: "*/*",
          "Content-Length": "0",
          Origin: "https://scratch.mit.edu",
          "Cache-Control": "max-age=0, no-cache",
          Pragma: "no-cache",
        },
        body: "",
      }
    );
    if (req.ok) {
      return true;
    } else {
      return false;
    }
  },
};

export default APIStudio;
