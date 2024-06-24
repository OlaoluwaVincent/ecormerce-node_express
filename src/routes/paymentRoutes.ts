import express, { Router } from 'express';
import paystackContoller from '../controllers/paystack';
import authenticate from '../middlewares/authenticate';
import asyncHandler from '../exceptions/AsyncHandler';

const router: Router = express.Router();

router.post('/init', authenticate, asyncHandler(paystackContoller.initPayment));
router.get(
  '/payment-callback',
  asyncHandler(paystackContoller.verifyTransaction)
);

export default router;
