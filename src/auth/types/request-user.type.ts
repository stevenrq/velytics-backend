export interface RequestUser {
  id: number;
  username: string;
  authorities: string[];
  jti?: string;
  exp?: number;
  isService?: boolean;
}

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}
