import type { Request } from 'express';

export type AuthRole = 'user' | 'responder' | 'admin';

export interface AuthContext {
  accountId: string;
  role: AuthRole;
  email: string;
}

export interface ValidatedParts<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body: TBody;
  query: TQuery;
  params: TParams;
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    auth?: AuthContext;
    validated?: ValidatedParts;
  }
}

export type AuthedRequest = Request & { auth: AuthContext };
