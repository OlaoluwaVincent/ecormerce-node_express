import express, { Router } from 'express';
import productController from '../controllers/product';
import authenticate, { authorizeRoles } from '../middlewares/authenticate';
import { upload } from '../utils/cloudinary';

const router: Router = express.Router();

router.get('/', productController.getProducts);
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
// router.put('/:id', authenticate, productController.updateUser);
// router.delete('/:id', authenticate, productController.deleteUser);

export default router;
