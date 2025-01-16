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
    }
}

export default APIUser;