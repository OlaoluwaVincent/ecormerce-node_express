import { Request } from 'express';

export interface UserType extends UserTokenType {
  hashedPassword: string;
}

export interface UserTokenType {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
}

export interface UserRequest extends Request {
  user?: UserTokenType;
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}
