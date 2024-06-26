import express, { Router } from 'express';
import authenticate from '../middlewares/authenticate';
import asyncHandler from '../exceptions/AsyncHandler';
import orderController from '../controllers/order';

const router: Router = express.Router();

router.get('/', authenticate, asyncHandler(orderController.orders));
router.put('/:id', authenticate, asyncHandler(orderController.update));
router.get(
  '/customer/:id',
  authenticate,
  asyncHandler(orderController.ordersForUsers)
);

router.get('/:id', authenticate, asyncHandler(orderController.order));
export default router;
