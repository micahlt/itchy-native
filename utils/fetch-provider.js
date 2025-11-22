import { fetch as expoFetch } from "expo/fetch";
import { getCookieString, setCookies } from "./cookie-manager";
import CookieManager from "@react-native-cookies/cookies";

const customFetch = async (url, options = {}) => {
    await CookieManager.clearAll();
    const cookieString = getCookieString();

    const headers = new Headers(options.headers || {});

    if (cookieString) {
        const existingCookie = headers.get("Cookie");
        if (existingCookie) {
            headers.set("Cookie", `${existingCookie}; ${cookieString}`);
        } else {
            headers.set("Cookie", cookieString);
        }
    }

    // Ensure credentials are not set to include/omit if they were passed in options
    const { credentials, ...restOptions } = options;

    const headersPlain = {};
    headers.forEach((value, key) => {
        headersPlain[key] = value;
    });

    const newOptions = {
        ...restOptions,
        headers: headersPlain,
    };

    console.log("🫳  FETCH |", url)
    console.log(newOptions)
    console.log("\n")

    const response = await expoFetch(url, newOptions);

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
        setCookies(setCookie);
    }

    console.log("🫴  RESPONSE |", response.status)

    return response;
};

export default customFetch;