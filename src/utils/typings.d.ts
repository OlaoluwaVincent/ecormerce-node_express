import { Request } from 'express';

export interface UserType extends UserTokenType {
  hashedPassword: String;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTokenType {
  username: string;
  fullname: string;
  _id: Types.ObjectId;
}

export interface UserRequest extends Request {
  user?: UserType;
}
