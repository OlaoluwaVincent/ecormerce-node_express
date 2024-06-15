import { NextFunction, Response } from 'express';
import { UserRequest } from '../utils/typings';

const protectedRoutes = (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export default protectedRoutes;
