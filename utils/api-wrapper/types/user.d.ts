export type User = {
  id: number;
  username: string;
  scratchteam: boolean;
  history: UserHistory;
  profile: UserProfile;
};

export type UserProfile = {
  id: number | null;
  images: UserProfilePictures;
  bio: string;
  status: string;
  country: string;
};

export type UserHistory = {
  joined: string;
};

export type UserProfilePictures = {
  "90x90"?: string;
  "60x60"?: string;
  "55x55"?: string;
  "50x50"?: string;
  "32x32"?: string;
};

export type CompleteUser = UserProfile & {
  featuredProject?: {
    label: string;
    title: string;
    thumbnail_url: string;
    id: number;
  } | null;
  followers: number;
  following: number;
};

export type FeedActivityType =
  | "favoriteproject"
  | "loveproject"
  | "shareproject"
  | "followuser"
  | "becomecurator"
  | "followstudio"
  | "addproject"
  | "remixproject"
  | "becomeownerstudio";

export type UserActivity = {
  id: number;
  actor_username?: string;
  actor_id?: number;
  datetime_created: string;
  type?: FeedActivityType;
  title?: string;
  project_id?: number;
  gallery_title?: string;
  gallery_id?: number;
  project_title?: string;
  followed_username?: string;
  recipient_id?: number;
  recipient_username?: string;
  parent_title?: string;
};
