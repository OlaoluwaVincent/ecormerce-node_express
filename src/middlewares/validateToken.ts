import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserType, UserRequest } from '../utils/typings';
import User from '../models/user';
import config from '../utils/config';

const authenticate = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded: any = jwt.verify(token, config.JWT_SECERT!);
    const user = await User.findById(decoded._id)
      .select('-hashedPassword')
      .exec();

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    req.user = user.toObject() as UserType;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export default authenticate;
