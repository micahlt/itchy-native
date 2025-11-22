import storage from "./storage";
import encryptedStorage from "./encryptedStorage";
import { setCookies, clearCookies } from "./cookie-manager";

const ACCOUNTS_CACHE_KEY = "accountsCache";

export const getAccounts = () => {
    const accountsJson = encryptedStorage.getString(ACCOUNTS_CACHE_KEY);
    try {
        return accountsJson ? JSON.parse(accountsJson) : {};
    } catch (e) {
        return {};
    }
};

export const saveAccount = (data) => {
    const accounts = getAccounts();
    // Use username as key
    accounts[data.username] = data;
    encryptedStorage.set(ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));
    setActiveAccount(data);
};

export const setActiveAccount = (data) => {
    storage.set("sessionID", data.sessionID);
    storage.set("csrfToken", data.csrfToken);
    storage.set("username", data.username);
    storage.set("cookieSet", data.cookieSet);
    storage.set("token", data.token);
    storage.set("user", JSON.stringify(data.user));

    // Clear existing cookies and set new ones
    clearCookies();
    setCookies(data.cookieSet);
};

export const switchAccount = (username) => {
    const accounts = getAccounts();
    const data = accounts[username];
    if (data) {
        setActiveAccount(data);
        return true;
    }
    return false;
};

export const removeAccount = (username) => {
    const accounts = getAccounts();
    delete accounts[username];
    encryptedStorage.set(ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));

    // If removing current user, logout
    const currentUsername = storage.getString("username");
    if (currentUsername === username) {
        // Try to switch to another account if available
        const remainingUsernames = Object.keys(accounts);
        if (remainingUsernames.length > 0) {
            switchAccount(remainingUsernames[0]);
        } else {
            // No accounts left, clear everything
            storage.delete("sessionID");
            storage.delete("csrfToken");
            storage.delete("username");
            storage.delete("cookieSet");
            storage.delete("token");
            storage.delete("user");
            clearCookies();
        }
    }
};
