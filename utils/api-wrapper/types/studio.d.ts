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

export type APIStudio = {
  getStudio: (id: string | number) => Promise<any>;
  getProjects: (
    id: string | number,
    offset?: number,
    limit?: number
  ) => Promise<any>;
  getActivity: (
    id: string | number,
    offset?: number,
    limit?: number
  ) => Promise<any>;
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
