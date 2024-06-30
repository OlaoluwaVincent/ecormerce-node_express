import express, { Router } from 'express';
import userController from '../controllers/auth';
import authenticate, { authorize } from '../middlewares/authenticate';
import { Role } from '../utils/typings';
import asyncHandler from '../exceptions/AsyncHandler';

const router: Router = express.Router();

router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  asyncHandler(userController.getAllusers)
);
router.post('/register', asyncHandler(userController.createUser));
router.post('/login', asyncHandler(userController.authUser));
router.post('/refresh-token', asyncHandler(userController.refreshToken));
router.put(
  '/change-password/:id',
  authenticate,
  asyncHandler(userController.changePassword)
);

router.get('/:id', asyncHandler(userController.getSpecificUser));
router.put('/:id', authenticate, asyncHandler(userController.updateUser));
router.delete('/:id', authenticate, asyncHandler(userController.deleteUser));

export default router;
