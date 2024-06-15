import { NextFunction, Request, Response } from 'express';
import authenticate from './validateToken';
import { excludedRoutesArray } from '../utils/excludedArray';

// Apply global authenticate middleware, but exclude specific routes
const excludedRoutes = (req: Request, res: Response, next: NextFunction) => {
  // Check if the current route is in the excluded list
  if (excludedRoutesArray.includes(req.path)) {
    return next();
  }

  // Apply the authenticate middleware
  authenticate(req, res, next);
};

export default excludedRoutes;
