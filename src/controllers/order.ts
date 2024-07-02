import { Response } from 'express';
import prisma from '../../prisma/prisma';
import { UserRequest } from '../utils/typings';
import HttpStatus from '../exceptions/httpStatus';
import asyncHandler from '../exceptions/AsyncHandler';

const getOrders = asyncHandler(async (req: UserRequest, res: Response) => {
  const { page, price, sort, range, discount } = req.query as {
    sort: string;
    price: string;
    page: string;
    range: string;
    discount: string;
  };

  // Default values
  const pageNumber = parseInt(page) || 1;
  const orderPerPage = 10;
  const skip = (pageNumber - 1) * orderPerPage;
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
  const orderBy = [] as any[];
  if (sort) {
    orderBy.push({ createdAt: sort });
  }
  if (price) {
    orderBy.push({ price: price });
  }

  // Fetch products with filtering, sorting, and pagination
  const orders = await prisma.orderItem.findMany({
    where: filter,
    orderBy: orderBy.length ? orderBy : undefined,
    skip: skip,
    take: orderPerPage,
    select: {
      id: true,
    },
  });

  // Get the total count of products for pagination
  const totalOrders = await prisma.orderItem.count({ where: filter });

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / orderPerPage);

  // Determine if there are next and previous pages
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  res.status(HttpStatus.OK).json({
    orders,
    pagination: {
      total: totalOrders,
      page: pageNumber,
      orderPerPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? pageNumber + 1 : null,
      previousPage: hasPreviousPage ? pageNumber - 1 : null,
    },
  });
});

const getUserOrders = asyncHandler(async (req: UserRequest, res: Response) => {
  const { page, price, sort, range, discount } = req.query as {
    sort: string;
    price: string;
    page: string;
    range: string;
    discount: string;
  };

  const userId = req.params.id as string;

  // Default values
  const pageNumber = parseInt(page) || 1;
  const orderPerPage = 10;
  const skip = (pageNumber - 1) * orderPerPage;
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
  const orderBy = [] as any[];
  if (sort) {
    orderBy.push({ createdAt: sort });
  }
  if (price) {
    orderBy.push({ price: price });
  }

  // Fetch products with filtering, sorting, and pagination
  const orders = await prisma.orderItem.findMany({
    where: filter,
    orderBy: orderBy.length ? orderBy : undefined,
    skip: skip,
    take: orderPerPage,
    select: {
      id: true,
    },
  });

  // Get the total count of products for pagination
  const totalOrders = await prisma.orderItem.count({ where: filter });

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / orderPerPage);

  // Determine if there are next and previous pages
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  res.status(HttpStatus.OK).json({
    orders,
    pagination: {
      total: totalOrders,
      page: pageNumber,
      orderPerPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? pageNumber + 1 : null,
      previousPage: hasPreviousPage ? pageNumber - 1 : null,
    },
  });
});

const getOrder = asyncHandler(async (req: UserRequest, res: Response) => {
  const id = req.params.id;
  const order = await prisma.orderItem.findUnique({
    where: { id },
    include: { product: true },
  });

  res.status(200).json(order);
});

const updateOrder = asyncHandler(async (req: UserRequest, res: Response) => {
  const id = req.params.id;
  const status = req.body.status as string;
  await prisma.orderItem.update({
    where: { id },

    data: {
      deliveryStatus: status,
    },
  });
  res.status(HttpStatus.OK).json('Updatated');
});

export default {
  getOrders,
  getOrder,
  updateOrder,
  getUserOrders,
};
