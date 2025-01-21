const APIExplore = {
    getExplore: async () => {
        const res = await fetch("https://api.scratch.mit.edu/proxy/featured");
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
                "x-token": token
            }
        });
        const data = await res.json();
        return data;
    },
    searchForProjects: async (query, sortMode = "popular", offset = 0, limit = 24) => {
        const res = await fetch(`https://api.scratch.mit.edu/search/projects?limit=${limit}&offset=${offset}&language=en&mode=${sortMode}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data;
    },
    searchForStudios: async (query, sortMode = "popular", offset = 0, limit = 24) => {
        const res = await fetch(`https://api.scratch.mit.edu/search/studios?limit=${limit}&offset=${offset}&language=en&mode=${sortMode}&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data;
    }
};

export default APIExplore;