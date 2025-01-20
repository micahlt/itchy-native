import APIAuth from "./auth";
import consts from "./consts";
import APIExplore from "./explore";
import APIMessages from "./messages";
import APIProject from "./project";
import APIUser from "./user";

const ScratchAPIWrapper = {
    explore: APIExplore,
    project: APIProject,
    user: APIUser,
    auth: APIAuth,
    messages: APIMessages,
    consts: consts
};

export default ScratchAPIWrapper;