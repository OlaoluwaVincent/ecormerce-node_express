import { NextFunction, Request, Response } from 'express';
import { CloudinaryImages, UserRequest } from '../utils/typings';
import {
  destroyExistingImage,
  transformData,
  uploadImages,
} from '../utils/cloudinary';
import prisma from '../../prisma/prisma';
import NotFoundException from '../exceptions/NotFoundException';
import Exception from '../exceptions/Exception';
import HttpStatus from '../exceptions/httpStatus';
import BadRequestException from '../exceptions/BadRequestException';
import asyncHandler from '../exceptions/AsyncHandler';

const create = asyncHandler(async (req: UserRequest, res: Response) => {
  const { name, price, discount, description, quantity } = req.body;

  if (!name || !price || !description || !quantity) {
    throw new BadRequestException('Please provide all required fields');
  }

  const images = req.files as Array<Express.Multer.File>;
  const user = req.user;

  if (!images) {
    throw new BadRequestException('Please provide Images');
  }

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
    throw new BadRequestException('Failed to create product');
  }

  return res.status(HttpStatus.CREATED).json(product);
});

const updateProduct = asyncHandler(async (req: UserRequest, res: Response) => {
  const { name, price, discount, description, quantity } = req.body;
  const deletedImages: CloudinaryImages[] = JSON.parse(req.body.deletedImages);
  const images = req.files as Array<Express.Multer.File>;

  const product = await prisma.product.findUnique({
    where: { id: req.params.id, userId: req.user?.id },
  });

  if (!product) {
    throw new Exception(HttpStatus.BAD_REQUEST, 'Product was not found');
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
    throw new BadRequestException('Failed to upload product');
  }

  res.json({ message: 'Product updated successfully', updatedProduct });
});

const getProducts = asyncHandler(async (_req: UserRequest, res: Response) => {
  const products = await prisma.product.findMany();

  return res.status(HttpStatus.OK).json(products);
});

const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });

  if (!product) {
    throw new NotFoundException(`Product was not found ${req.params.id}`);
  }

  res.status(HttpStatus.OK).json(product);
});

const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.delete({
    where: { id: req.params.id },
  });

  //Transform from JSON_Data
  const deletedImages = transformData(product.images);

  if (deletedImages.length) {
    destroyExistingImage(deletedImages);
  }

  res.status(HttpStatus.OK).json({ message: 'Product Deleted' });
});

const getUserProducts = asyncHandler(
  async (req: UserRequest, res: Response) => {
    const products = await prisma.product.findMany({
      where: { userId: req.params.id },
    });

    return res.status(HttpStatus.OK).json(products);
  }
);

export default {
  create,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
};
