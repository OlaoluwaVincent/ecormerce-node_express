import { NextFunction, Response } from 'express';
import { UserRequest } from '../utils/typings';
import User from '../models/user';
import { verifyToken } from '../utils/token';

const authenticate = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res
      .status(401)
      .json({ message: 'Unauthorized Access, please login' });

  const decoded = verifyToken(token);
  const user = await User.findById(decoded._id).select('-hashedPassword');

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not found' });
  }

  req.user = user;
  next();
};

export default authenticate;
