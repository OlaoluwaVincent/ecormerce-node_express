import { NextFunction, Response } from 'express';
import { CloudinaryImages, UserRequest } from '../utils/typings';
import {
  destroyExistingImage,
  transformData,
  uploadImages,
} from '../utils/cloudinary';
import prisma from '../../prisma/prisma';
import { Prisma } from '@prisma/client';

const create = async (req: UserRequest, res: Response) => {
  const { name, price, discount, description, quantity } = req.body;

  if (!name || !price || !discount || !description || !quantity) {
    res.status(400).json({ message: 'All fields required' });
  }

  const images = req.files as Array<Express.Multer.File>;
  const user = req.user;

  try {
    if (images) {
      const uploadedImages = await uploadImages(images);

      const product = await prisma.product.create({
        data: {
          images: uploadedImages,
          name,
          price: Number(price),
          discount: Number(discount),
          description,
          quantity: Number(quantity),
          User: { connect: { id: user?.id } },
        },
      });

      if (!product) {
        return res.status(400).json({ message: 'Failed to create product' });
      }

      return res.status(201).json(product);
    } else {
      return res.status(400).json({ message: 'No image file provided' });
    }
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (_req: UserRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany();

    return res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// Define your updateProduct handler
const updateProduct = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, price, discount, description, quantity } = req.body;
    const deletedImages: CloudinaryImages[] = req.body.deletedImages;
    const images = req.files as Array<Express.Multer.File>;

    const product = await prisma.product.findUnique({
      where: { id: req.params.id, userId: req.user?.id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (deletedImages.length) {
      destroyExistingImage(deletedImages);
    }

    let uploadedImages = [] as {
      url: string;
      public_id: string;
    }[];

    if (images) {
      uploadedImages = await uploadImages(images);
    }

    const filtered = transformData(product.images).filter(
      (dItem) =>
        !deletedImages.some((eItem) => eItem.public_id === dItem.public_id)
    );

    const newImages = [...uploadedImages, ...filtered];

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        images: newImages,
        name: name || product.name,
        description: description || product.description,
        price: Number(price) || product.price,
        discount: Number(discount) || product.discount,
        quantity: Number(quantity) || product.quantity,
      },
    });

    if (!updatedProduct) {
      return res.status(400).json({ message: 'Failed to update product' });
    }

    res.json({ message: 'Product updated successfully', updatedProduct });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  create,
  getProducts,
  updateProduct,
};
