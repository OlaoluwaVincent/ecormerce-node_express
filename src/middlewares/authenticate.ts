import { NextFunction, Response } from 'express';
import { Role, UserRequest, UserType } from '../utils/typings';
import { verifyToken } from '../utils/token';
import prisma from '../../prisma/prisma';
import asyncHandler from '../exceptions/AsyncHandler';

const authenticate = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
      return res
        .status(401)
        .json({ message: 'Unauthorized Access, please login' });

    const decoded = verifyToken(token);
    const user = await prisma.user.findFirst({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    req.user = user as UserType;
    next();
  }
);
export function authorizeRoles(...roles: Role[]) {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export default authenticate;
