import { UserProfilePictures } from "./user";

export type Project = {
  id: number;
  author: ProjectAuthor;
  title: string;
  instructions: string;
  description: string;
  visibility: string;
  public: boolean;
  is_published: boolean;
  comments_allowed: boolean;
  image: string;
  images: ProjectThumbnails;
  history: ProjectHistory;
  stats: ProjectStats;
  remix: ProjectRemix;
  project_token?: string;
};

export type ProjectAuthor = {
  id: number;
  username: string;
  scratchteam: boolean;
  profile: ProjectProfile;
};

export type ProjectProfile = {
  id: number | null;
  images: UserProfilePictures;
};

export type ProjectThumbnails = Record<string, string>;

export type ProjectHistory = {
  created: string;
  modified: string;
  shared?: string;
};

export type ProjectStats = {
  views: number;
  loves: number;
  favorites: number;
  remixes: number;
};

export type ProjectRemix = {
  parent: number | null;
  root: number | null;
};

export type ProjectInteractions = {
  loved: boolean;
  favorited: boolean;
};

export type Comment = {
  id?: string;
  content: string;
  replies?: Comment[];
  author: {
    username?: string;
    image?: string;
    id?: string;
  };
  datetime_created: Date;
  includesReplies: boolean;
  parentID?: string;
};
