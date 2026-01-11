import fetch from "../fetch-provider";
import { MessagesFilter, ScratchMessage } from "./types/messages";

const APIMessages = {
  /**
   * @param {String} token
   * @param {String} username
   * @param {Number} offset
   * @param {MessagesFilter} filter
   * @returns
   */
  getMessages: async function (
    username: string,
    token: string,
    offset: number = 0,
    filter: MessagesFilter = "",
    limit: number = 30
  ): Promise<ScratchMessage[]> {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${username}/messages?offset=${offset}&filter=${filter}&limit=${limit}`,
      {
        headers: {
          "x-token": token,
        },
      }
    );
    const data = await res.json();
    return data;
  },
  getMessageCount: async function (username: string): Promise<number> {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${username}/messages/count?cacheBust=${Date.now()}`
    );
    const data = await res.json();
    return data.count;
  },
};

export default APIMessages;
