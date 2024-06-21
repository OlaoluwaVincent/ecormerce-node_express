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
  exp: number;
}

export interface UserRequest extends Request {
  user?: UserTokenType;
  file?: Express.Multer.File;
  // files?: Array<Express.Multer.File>;
}

export interface CloudinaryImages {
  url: string;
  public_id: string;
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}
