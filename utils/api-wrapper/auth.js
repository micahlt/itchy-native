import consts from "./consts";

const APIAuth = {
    login: async (user, pass) => {
        const csrfFetch = await fetch("https://scratch.mit.edu/csrf_token/");
        const initialCSRF = /scratchcsrftoken=(.*?);/gm.exec(csrfFetch.headers.get("set-cookie"))[1];
        // a lot of this code is taken from
        // https://github.com/webdev03/meowclient/blob/main/src/ScratchSession.ts
        const headers = {
            "x-csrftoken": initialCSRF,
            "x-requested-with": "XMLHttpRequest",
            Cookie: `scratchcsrftoken=${initialCSRF};scratchlanguage=en;`,
            referer: "https://scratch.mit.edu",
            "User-Agent": consts.UserAgent
        };
        const loginReq = await fetch("https://scratch.mit.edu/login/", {
            method: "POST",
            body: JSON.stringify({
                username: user,
                password: pass
            }),
            headers: headers
        });
        if (!loginReq.ok) {
            const t = await loginReq.text();
            console.error(t);
            throw new Error("Login failed.  Status " + loginReq.status);
        }

        const setCookie = loginReq.headers.get("set-cookie");
        if (!setCookie) throw Error("Something went wrong");
        const csrfToken = /scratchcsrftoken=(.*?);/gm.exec(setCookie)[1];
        const token = /"(.*)"/gm.exec(setCookie)[1];
        const cookieSet =
            "scratchcsrftoken=" +
            csrfToken +
            ";scratchlanguage=en;scratchsessionsid=" +
            token +
            ";";
        const sessionFetch = await fetch("https://scratch.mit.edu/session", {
            method: "GET",
            headers: {
                Cookie: cookieSet,
                "User-Agent": consts.UserAgent,
                Referer: "https://scratch.mit.edu/",
                "Cache-Control": "max-age=0, no-cache",
                "X-Requested-With": "XMLHttpRequest",
                Pragma: "no-cache",
                Accept: "*/*",
                "Accept-Encoding": "gzip, deflate, br"
            }
        });
        const sessionJSON = await sessionFetch.json();
        return {
            username: user,
            csrfToken,
            sessionToken: token,
            cookieSet,
            sessionJSON
        };
    },
    logout: async (cookie) => {
        const csrfFetch = await fetch("https://scratch.mit.edu/csrf_token/", {
            headers: {
                Cookie: cookie
            }
        });
        const setCookie = csrfFetch.headers.get("set-cookie");
        const csrfToken = /scratchcsrftoken=(.*?);/gm.exec(setCookie)[1];
        const logoutFetch = await fetch(
            "https://scratch.mit.edu/accounts/logout/",
            {
                method: "POST",
                body: `csrfmiddlewaretoken=${csrfToken}`,
                headers: {
                    Cookie: cookie,
                    "User-Agent": consts.UserAgent,
                    accept: "application/json",
                    Referer: "https://scratch.mit.edu/",
                    Origin: "https://scratch.mit.edu",
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "*/*",
                    "Accept-Encoding": "gzip, deflate, br"
                }
            }
        );
        if (!logoutFetch.ok) {
            throw new Error(`Error in logging out. ${logoutFetch.status}`);
        }
    }
}

export default APIAuth;