import express, { Router } from 'express';
import productController from '../controllers/product';
import authenticate, { authorize } from '../middlewares/authenticate';
import { upload } from '../utils/cloudinary';
import { Role } from '../utils/typings';

const router: Router = express.Router();

router.get('/', productController.getProducts);
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
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
router.get('/:id', productController.getProduct);

export default router;
