import fetch from "../fetch-provider";
import { ExploreData } from "./types/explore";
import { Project } from "./types/project";
import { Studio } from "./types/studio";

const APIExplore = {
  getExplore: async (): Promise<ExploreData> => {
    const res = await fetch("https://api.scratch.mit.edu/proxy/featured", {
      headers: {
        Origin: "https://scratch.mit.edu",
      },
    });
    const data = await res.json();
    return {
      featured: data.community_featured_projects,
      topLoved: data.community_most_loved_projects,
      topRemixed: data.community_most_remixed_projects,
      curated: data.curated_top_projects,
      designStudio: data.scratch_design_studio,
      newest: data.community_newest_projects,
      featuredStudios: data.community_featured_studios,
    };
  },
  getFriendsLoves: async (username: string, token: string): Promise<any> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${username}/following/users/loves`,
      {
        headers: {
          "x-token": token,
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    return data;
  },
  getFriendsProjects: async (username: string, token: string): Promise<any> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${username}/following/users/projects`,
      {
        headers: {
          "x-token": token,
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    return data;
  },
  searchForProjects: async (
    query: string,
    sortMode: string = "popular",
    offset: number = 0,
    limit: number = 40
  ): Promise<Project[]> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/search/projects?limit=${limit}&offset=${offset}&language=en&mode=${sortMode}&q=${encodeURIComponent(
        query
      )}`
    );
    const data = await res.json();
    return data;
  },
  searchForStudios: async (
    query: string,
    sortMode: string = "popular",
    offset: number = 0,
    limit: number = 40
  ): Promise<Studio[]> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/search/studios?limit=${limit}&offset=${offset}&language=en&mode=${sortMode}&q=${encodeURIComponent(
        query
      )}`
    );
    const data = await res.json();
    return data;
  },
  getFeed: async (
    username: string,
    token: string,
    offset: number = 0,
    limit: number = 4
  ): Promise<any> => {
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${username}/following/users/activity?limit=${limit}&offset=${offset}&cacheBust=${Date.now()}`,
      {
        headers: {
          "x-token": token,
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    return data;
  },
};

export default APIExplore;
