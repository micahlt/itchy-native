export interface AuthSession {
  username?: string;
  csrfToken: string;
  sessionToken: string;
  cookieSet: string;
  sessionJSON: any;
  isLoggedIn?: boolean;
}
