const APIStudio = {
    getStudio: async (id) => {
        const res = await fetch(`https://api.scratch.mit.edu/studios/${id}`);
        const data = await res.json();
        return data;
    },
    getProjects: async (id) => {
        const res = await fetch(`https://api.scratch.mit.edu/studios/${id}/projects`);
        const data = await res.json();
        return data;
    },
}

export default APIStudio;