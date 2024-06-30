import express from 'express';
// import RateLimit from 'express-rate-limit';
import userRouter from './userRoutes';
import productRouter from './productRoutes';
import paymentRouter from './paymentRoutes';
import orderRouter from './orderRoutes';

const router = express.Router();

// const limiter = RateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 30,
// });

// apply rate limiter to all requests
// router.use(limiter);

router.use('/users', userRouter);
router.use('/products', productRouter);
router.use('/payment', paymentRouter);
router.use('/orders', orderRouter);

export default router;
