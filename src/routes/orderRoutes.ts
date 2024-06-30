import express, { Router } from 'express';
import authenticate from '../middlewares/authenticate';
import asyncHandler from '../exceptions/AsyncHandler';
import orderController from '../controllers/order';

const router: Router = express.Router();

router.get('/', authenticate, asyncHandler(orderController.getOrders));
router.get(
  '/my-order',
  authenticate,
  asyncHandler(orderController.getUserOrders)
);
router.get('/:id', authenticate, asyncHandler(orderController.getOrder));
router.put('/:id', authenticate, asyncHandler(orderController.updateOrder));
export default router;
