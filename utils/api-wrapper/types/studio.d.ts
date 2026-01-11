import { Project } from "./project";

export type Studio = {
  id: number;
  title: string;
  host: number;
  description: string;
  visibility: string;
  public: boolean;
  open_to_all: boolean;
  comments_allowed: boolean;
  image?: string;
  history: StudioHistory;
  stats: StudioStats;
};

export type StudioHistory = {
  created: string;
  modified: string;
};

export type StudioStats = {
  comments?: number;
  followers?: number;
  managers?: number;
  projects?: number;
};

export type StudioActivityType =
  | "addprojecttostudio"
  | "removeprojectstudio"
  | "becomecurator"
  | "becomeownerstudio"
  | "updatestudio";

export type StudioActivity = {
  id: number;
  datetime_created: string;
  type: StudioActivityType;
  actor_username?: string;
  actor_id?: number;
  recipient_username?: string;
  project_id?: number;
  username?: string;
  parent_title?: string;
  title?: string;
  project_title?: string;
  gallery_title?: string;
};

export type APIStudio = {
  getStudio: (id: string | number) => Promise<Studio>;
  getProjects: (
    id: string | number,
    offset?: number,
    limit?: number
  ) => Promise<Project[]>;
  getActivity: (
    id: string | number,
    offset?: number,
    limit?: number
  ) => Promise<StudioActivity[]>;
  getComments: (
    id: string | number,
    offset?: number,
    limit?: number,
    includeReplies?: boolean
  ) => Promise<any>;
  getCommentReplies: (
    id: string | number,
    parentCommentID: string
  ) => Promise<any>;
  postComment: (
    studioID: string | number,
    content: string,
    csrf: string,
    token: string,
    parentID?: string,
    commentee?: string
  ) => Promise<string>;
  deleteComment: (
    studioID: string | number,
    commentID: string,
    csrf: string,
    token: string
  ) => Promise<boolean>;
  getRelationship: (
    username: string,
    studioID: string | number,
    token: string
  ) => Promise<any>;
  follow: (
    studioID: string | number,
    myUsername: string,
    csrf: string
  ) => Promise<boolean>;
  unfollow: (
    studioID: string | number,
    myUsername: string,
    csrf: string
  ) => Promise<boolean>;
};
