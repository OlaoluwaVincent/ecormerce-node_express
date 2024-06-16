import express, { Router } from 'express';
import userController from '../controllers/auth';
import authenticate from '../middlewares/authenticate';

const router: Router = express.Router();

router.get('/', authenticate, userController.getAllusers);
router.get('/:id', userController.getSpecificUser);
router.post('/register', userController.createUser);
router.post('/login', userController.authUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);
router.put('/change-password/:id', authenticate, userController.changePassword);

export default router;
