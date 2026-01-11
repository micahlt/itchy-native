export type MessagesFilter = "comments" | "project" | "studios" | "forums" | "";

export type MessageType =
  | "admin"
  | "studioactivity"
  | "followuser"
  | "loveproject"
  | "favoriteproject"
  | "addcomment"
  | "remixproject"
  | "curatorinvite"
  | "becomeownerstudio"
  | "becomehoststudio"
  | "forumpost";

export interface ScratchMessage {
  id: number;
  type: MessageType;
  datetime_created: string;
  actor_username?: string;
  actor_id?: number;
  title?: string;
  project_title?: string;
  project_id?: number;
  parent_title?: string;
  comment_fragment?: string;
  comment_type?: number;
  comment_obj_id?: number;
  comment_obj_title?: string;
  comment_id?: number;
  gallery_id?: number;
  gallery_title?: string;
  topic_id?: number;
  topic_title?: string;
  message?: string;
}
