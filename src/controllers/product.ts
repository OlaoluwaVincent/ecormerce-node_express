import { Request, Response } from 'express';
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
      user: { connect: { id: user?.id } },
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

const getProducts = asyncHandler(async (req: UserRequest, res: Response) => {
  const { page, price, sort, range, discount } = req.query as {
    sort: string;
    price: string;
    page: string;
    range: string;
    discount: string;
  };

  // Default values
  const pageNumber = parseInt(page) || 1;
  const productPerPage = 10;
  const skip = (pageNumber - 1) * productPerPage;
  const maxPrice = parseFloat(range) || null;
  const hasDiscount = !!discount;

  // Create a filter object based on the status query parameter
  const filter: any = {};

  if (maxPrice) {
    filter.price = { lte: maxPrice };
  }
  if (hasDiscount) {
    filter.discount = { gte: 0 };
  }

  // Create an orderBy object for sorting
  const orderBy: any[] = [];
  if (sort) {
    orderBy.push({ createdAt: sort });
  }
  if (price) {
    orderBy.push({ price: price });
  }

  // Fetch products with filtering, sorting, and pagination
  const products = await prisma.product.findMany({
    where: filter,
    orderBy: orderBy.length ? orderBy : undefined,
    skip: skip,
    take: productPerPage,
  });

  // Get the total count of products for pagination
  const totalOrders = await prisma.product.count({ where: filter });

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / productPerPage);

  // Determine if there are next and previous pages
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  res.status(HttpStatus.OK).json({
    products,
    pagination: {
      total: totalOrders,
      page: pageNumber,
      productPerPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? pageNumber + 1 : null,
      previousPage: hasPreviousPage ? pageNumber - 1 : null,
    },
  });
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
    const userId = req.params.id as string;

    const { page, price, sort, range, discount } = req.query as {
      sort: string;
      price: string;
      page: string;
      range: string;
      discount: string;
    };

    // Default values
    const pageNumber = parseInt(page) || 1;
    const productPerPage = 10;
    const skip = (pageNumber - 1) * productPerPage;
    const maxPrice = parseFloat(range) || null;
    const hasDiscount = !!discount;

    // Create a filter object based on the status query parameter
    const filter: any = {};

    filter.userId = userId;

    if (maxPrice) {
      filter.price = { lte: maxPrice };
    }
    if (hasDiscount) {
      filter.discount = { gte: 0 };
    }

    // Create an orderBy object for sorting
    const orderBy: any[] = [];
    if (sort) {
      orderBy.push({ createdAt: sort });
    }
    if (price) {
      orderBy.push({ price: price });
    }

    // Fetch products with filtering, sorting, and pagination
    const products = await prisma.product.findMany({
      where: filter,
      orderBy: orderBy.length ? orderBy : undefined,
      skip: skip,
      take: productPerPage,
    });

    // Get the total count of products for pagination
    const totalOrders = await prisma.product.count({ where: filter });

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / productPerPage);

    // Determine if there are next and previous pages
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    res.status(HttpStatus.OK).json({
      products,
      pagination: {
        total: totalOrders,
        page: pageNumber,
        productPerPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        previousPage: hasPreviousPage ? pageNumber - 1 : null,
      },
    });
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
