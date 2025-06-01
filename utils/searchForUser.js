import APIUser from "./api-wrapper/user";

export default function searchForUser(query) {
    return new Promise((resolve) => {
        query = query.trim().toLowerCase();
        const firstWord = query.split(" ")[0];
        const splitAsDashes = query.replaceAll(" ", "-");
        const splitAsUnderscores = query.replaceAll(" ", "_");
        const replaceIWithL = query.replaceAll("i", "l");
        const replaceLWithI = query.replaceAll("l", "i");
        let possibleUsers = [];
        const pushVariant = (variant) => {
            if (variant.length < 3) return;
            if (possibleUsers.includes(variant)) return;
            possibleUsers.push(variant);
        };
        [splitAsDashes, splitAsUnderscores, firstWord, replaceIWithL, replaceLWithI].forEach((variant) => {
            pushVariant(variant);
            pushVariant(`-${variant}`);
            pushVariant(`-${variant}-`);
            pushVariant(`_${variant}`);
            pushVariant(`_${variant}_`);
        });
        const fetchArray = possibleUsers.map((username) => new Promise((resolve, reject) => {
            APIUser.doesExist(username).then((exists) => {
                if (exists) {
                    APIUser.getCompleteProfile(username).then((user) => {
                        if (user) {
                            resolve(user);
                        } else {
                            resolve(null);
                        }
                    });
                } else {
                    resolve(null);
                }
            });
        }));
        Promise.allSettled(fetchArray).then((results) => {
            let users = [];
            results.forEach((result) => {
                if (result.status === "fulfilled" && result.value) {
                    users.push(result.value);
                }
            });
            users.sort((a, b) => b.followers - a.followers);
            resolve(users);
        })
    });
}