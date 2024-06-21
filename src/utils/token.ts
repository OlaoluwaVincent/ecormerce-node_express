import jwt from 'jsonwebtoken';
import { UserTokenType } from './typings';
import config from './config';
import BadRequestException from '../exceptions/BadRequestException';

const secret: string | null = config.JWT_SECERT ?? null;

function generateToken(user: any, duration: string | number = '1h') {
  const token = jwt.sign({ ...user }, secret!, {
    expiresIn: duration,
  });
  return token;
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret!) as UserTokenType;
  } catch (err) {
    throw new BadRequestException('Invalid token');
  }
}

export { generateToken, verifyToken };
