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
  userController.getAllusers
);
router.get('/:id', userController.getSpecificUser);
router.post('/register', asyncHandler(userController.createUser));
router.post('/login', userController.authUser);
router.post('/refresh-token', userController.refreshToken);
router.put('/change-password/:id', authenticate, userController.changePassword);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

export default router;
