import express, { Router } from 'express';
import productController from '../controllers/product';
import authenticate from '../middlewares/authenticate';
import { upload } from '../utils/cloudinary';

const router: Router = express.Router();

router.get('/', productController.getProducts);
router.get('/user/:id', productController.getUserProducts);
router.get('/:id', productController.getProduct);
router.post(
  '/',
  authenticate,
  upload.array('images', 2),
  productController.create
);

router.put(
  '/:id',
  authenticate,
  upload.array('images', 2),
  productController.updateProduct
);
router.delete('/:id', authenticate, productController.deleteProduct);

export default router;
