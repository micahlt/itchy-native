const UserAgent = "Mozilla/5.0";
const APIAuth = {
    login: async (user, pass) => {
        // a lot of this code is taken from
        // https://github.com/webdev03/meowclient/blob/main/src/ScratchSession.ts
        const headers = {
            "x-csrftoken": "a",
            "x-requested-with": "XMLHttpRequest",
            Cookie: "scratchcsrftoken=a;scratchlanguage=en;",
            referer: "https://scratch.mit.edu",
            "User-Agent": UserAgent
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
                "User-Agent": UserAgent,
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
            token,
            cookieSet,
            sessionJSON
        };
    },
    logout: async (csrf, cookie) => {
        const logoutFetch = await fetch(
            "https://scratch.mit.edu/accounts/logout/",
            {
                method: "POST",
                body: `csrfmiddlewaretoken=${csrf}`,
                headers: {
                    Cookie: cookie,
                    "User-Agent": UserAgent,
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