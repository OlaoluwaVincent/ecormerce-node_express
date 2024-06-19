import jwt from 'jsonwebtoken';
import { UserTokenType } from './typings';
import config from './config';

const secret: string | null = config.JWT_SECERT ?? null;

function generateToken(user: any) {
  const token = jwt.sign({ ...user }, secret!, {
    expiresIn: '1h',
  });
  return token;
}

function verifyToken(token: string) {
  return jwt.verify(token, secret!) as UserTokenType;
}

export { generateToken, verifyToken };
