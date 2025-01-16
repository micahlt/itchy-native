import APIAuth from "./auth";
import APIExplore from "./explore";
import APIProject from "./project";
import APIUser from "./user";

const ScratchAPIWrapper = {
    explore: APIExplore,
    project: APIProject,
    user: APIUser,
    auth: APIAuth
};

export default ScratchAPIWrapper;