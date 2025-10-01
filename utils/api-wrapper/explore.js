import fetch from "../fetch-provider";

const APIExplore = {
    getExplore: async () => {
        console.log("Getting explore")
        const res = await fetch("https://api.scratch.mit.edu/proxy/featured", {
            headers: {
                "Origin": "https://scratch.mit.edu"
            }
        });
        console.log(res.status)
        const data = await res.json();
        return {
            featured: data.community_featured_projects,
            topLoved: data.community_most_loved_projects,
            topRemixed: data.community_most_remixed_projects,
            curated: data.curated_top_projects,
            designStudio: data.scratch_design_studio,
            newest: data.community_newest_projects,
            featuredStudios: data.community_featured_studios
        }
    },
    getFriendsLoves: async (username, token) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/following/users/loves`, {
            headers: {
                "x-token": token,
                "Accept": "application/json"
            }
        });
        const data = await res.json();
        return data;
    },
    getFriendsProjects: async (username, token) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/following/users/projects`, {
            headers: {
                "x-token": token,
                "Accept": "application/json"
            }
        });
        const data = await res.json();
        return data;
    },
    searchForProjects: async (query, sortMode = "popular", offset = 0, limit = 40) => {
        const res = await fetch(`https://api.scratch.mit.edu/search/projects?limit=${limit}&offset=${offset}&language=en&mode=${sortMode}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data;
    },
    searchForStudios: async (query, sortMode = "popular", offset = 0, limit = 40) => {
        const res = await fetch(`https://api.scratch.mit.edu/search/studios?limit=${limit}&offset=${offset}&language=en&mode=${sortMode}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data;
    },
    getFeed: async (username, token, offset = 0, limit = 4) => {
        const res = await fetch(`https://api.scratch.mit.edu/users/${username}/following/users/activity?limit=${limit}&offset=${offset}`, {
            headers: {
                "x-token": token,
                "Accept": "application/json"
            }
        });
        const data = await res.json();
        return data;
    },
};

export default APIExplore;