import storage from "./storage";

const COOKIE_KEY = "user_cookies";

export const getCookies = () => {
    const cookiesJson = storage.getString(COOKIE_KEY);
    try {
        return cookiesJson ? JSON.parse(cookiesJson) : {};
    } catch (e) {
        return {};
    }
};

export const getCookieString = () => {
    const cookies = getCookies();
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
};

export const setCookies = (setCookieHeader) => {
    if (!setCookieHeader) return;

    const cookies = getCookies();

    // Handle array (if fetch returns array) or string
    // The user specified that we should rely on the header being a string separated with semicolons
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    headers.forEach(header => {
        const parts = header.split(';');
        parts.forEach(part => {
            const separatorIndex = part.indexOf('=');
            if (separatorIndex !== -1) {
                const key = part.substring(0, separatorIndex).trim();
                const value = part.substring(separatorIndex + 1).trim();

                // Filter out common cookie attributes so they don't get stored as cookies
                const lowerKey = key.toLowerCase();
                if (['path', 'domain', 'expires', 'max-age', 'secure', 'httponly', 'samesite'].includes(lowerKey)) {
                    return;
                }

                if (key) {
                    cookies[key] = value;
                }
            }
        });
    });

    // console.log("🍪 COOKIES | set")
    // console.log(cookies);
    storage.set(COOKIE_KEY, JSON.stringify(cookies));

    storage.set("cookieSet", getCookieString());
};

export const clearCookies = () => {
    storage.delete(COOKIE_KEY);
    storage.delete("cookieSet");
};
