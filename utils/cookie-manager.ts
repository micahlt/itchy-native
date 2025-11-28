import storage from "./storage";

export type Cookies = {
  [key: string]: string;
};

const COOKIE_KEY = "user_cookies";

export const getCookies = (): Cookies => {
  const cookiesJson = storage.getString(COOKIE_KEY);
  try {
    return cookiesJson ? (JSON.parse(cookiesJson) as Cookies) : {};
  } catch (e) {
    return {};
  }
};

export const getCookieString = (): string => {
  const cookies = getCookies();
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
};

export const setCookies = (setCookieHeader: string) => {
  if (!setCookieHeader) return;

  const cookies = getCookies();

  const parts = setCookieHeader.split(";");
  parts.forEach((part) => {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex !== -1) {
      const key = part.substring(0, separatorIndex).trim();
      const value = part.substring(separatorIndex + 1).trim();

      // Filter out common cookie attributes so they don't get stored as cookies
      const lowerKey = key.toLowerCase();
      if (
        [
          "path",
          "domain",
          "expires",
          "max-age",
          "secure",
          "httponly",
          "samesite",
        ].includes(lowerKey)
      ) {
        return;
      }

      if (key) {
        cookies[key] = value;
      }
    }
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
