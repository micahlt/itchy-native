const APIProject = {
    getProject: async (id) => {
        const res = await fetch(`https://api.scratch.mit.edu/projects/${id}`);
        const data = await res.json();
        return data;
    }
}

export default APIProject;