import consts from "./consts";
import fetch from "../fetch-provider";

const APIAuth = {
    login: async (user, pass) => {
        const csrfFetch = await fetch("https://scratch.mit.edu/csrf_token/");
        let initialCSRF = /scratchcsrftoken=(.*?);/gm.exec(csrfFetch.headers.get("set-cookie"))[1];
        // a lot of this code is taken from
        // https://github.com/webdev03/meowclient/blob/main/src/ScratchSession.ts
        const headers = {
            "X-Csrftoken": initialCSRF,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
            "User-Agent": consts.UserAgent,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': "0",
            "Origin": "https://scratch.mit.edu",
            "Referer": "https://scratch.mit.edu/"
        };
        const loginReq = await fetch("https://scratch.mit.edu/login/", {
            method: "POST",
            credentials: "include",
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
                Accept: "application/json",
                "Content-Type": "application/json",
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
                }
            }
        );
        if (!logoutFetch.ok) {
            throw new Error(`Error in logging out. ${logoutFetch.status}`);
        }
    },
    getSession: async (existingCookies = "") => {
        const sessionFetch = await fetch("https://scratch.mit.edu/session?nocache=1", {
            method: "GET",
            credentials: "omit",
            headers: {
                Cookie: existingCookies,
                "User-Agent": consts.UserAgent,
                Referer: "https://scratch.mit.edu/",
                "Cache-Control": "max-age=0, no-cache",
                "X-Requested-With": "XMLHttpRequest",
                Pragma: "no-cache",
                Accept: "application/json",
            }
        });
        const sessionJSON = await sessionFetch.json();
        const setCookie = sessionFetch.headers.get("set-cookie");
        if (!setCookie) {
            return false;
        }
        const csrfToken = /scratchcsrftoken=(.*?);/gm.exec(setCookie)[1];
        const token = /"(.*)"/gm.exec(setCookie)[1];
        const cookieSet =
            "scratchcsrftoken=" +
            csrfToken +
            ";scratchlanguage=en;scratchsessionsid=" +
            token +
            ";";
        return {
            csrfToken,
            sessionToken: token,
            cookieSet,
            sessionJSON
        };
    }
}

export default APIAuth;