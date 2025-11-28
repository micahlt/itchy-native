import { CompleteUser } from "./api-wrapper/types/user";
import APIUser from "./api-wrapper/user";

export default function searchForUser(query: string): Promise<CompleteUser[]> {
  return new Promise((resolve) => {
    query = query.trim().toLowerCase();
    const firstWord = query.split(" ")[0];
    const splitAsDashes = query.replaceAll(" ", "-");
    const splitAsUnderscores = query.replaceAll(" ", "_");
    const replaceIWithL = query.replaceAll("i", "l");
    const replaceLWithI = query.replaceAll("l", "i");
    let possibleUsers: string[] = [];
    const pushVariant = (variant: string) => {
      if (variant.length < 3) return;
      if (possibleUsers.includes(variant)) return;
      possibleUsers.push(variant);
    };
    [
      splitAsDashes,
      splitAsUnderscores,
      firstWord,
      replaceIWithL,
      replaceLWithI,
    ].forEach((variant) => {
      pushVariant(variant);
      pushVariant(`-${variant}`);
      pushVariant(`-${variant}-`);
      pushVariant(`_${variant}`);
      pushVariant(`_${variant}_`);
    });
    const fetchArray = possibleUsers.map(
      (username) =>
        new Promise((resolve) => {
          APIUser.doesExist(username).then((exists) => {
            if (exists) {
              APIUser.getCompleteProfile(username).then(
                (user: CompleteUser) => {
                  if (user) {
                    resolve(user);
                  } else {
                    resolve(null);
                  }
                }
              );
            } else {
              resolve(null);
            }
          });
        })
    );
    Promise.allSettled(fetchArray).then((results) => {
      let users: CompleteUser[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          users.push(result.value as CompleteUser);
        }
      });
      users.sort((a, b) => b.followers - a.followers);
      resolve(users);
    });
  });
}
