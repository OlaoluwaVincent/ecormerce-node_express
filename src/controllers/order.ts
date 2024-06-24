import { Request, Response } from 'express';
import prisma from '../../prisma/prisma';
import Exception from '../exceptions/Exception';
import HttpStatus from '../exceptions/httpStatus';

const orders = async (req: Request, res: Response) => {
  const { page, price, status, sort } = req.query as {
    page: string;
    price: string;
    status: string;
    sort: string;
  };

  // Default values
  const pageNumber = parseInt(page) || 1;
  const orderPerPage = 1;
  const skip = (pageNumber - 1) * orderPerPage;

  // Create a filter object based on the status query parameter
  const filter: any = {};

  if (status) {
    filter.status = status;
  }

  // Create an orderBy object for sorting
  const orderBy: any[] = [];
  if (sort) {
    orderBy.push({ createdAt: sort });
  }
  if (price) {
    orderBy.push({ price: price });
  }

  // Fetch orders with filtering, sorting, and pagination
  const orders = await prisma.order.findMany({
    where: filter,
    orderBy: orderBy.length ? orderBy : undefined,
    skip: skip,
    take: orderPerPage,
  });

  // Get the total count of orders for pagination
  const totalOrders = await prisma.order.count({ where: filter });

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
};

const ordersForUsers = async (req: Request, res: Response) => {
  const user_id: string = req.params.id as string;

  if (!user_id) {
    throw new Exception(400, 'Please provide the user_id');
  }

  const orders = await prisma.order.findMany({ where: { userId: user_id } });
  res.status(HttpStatus.OK).json(orders);
};

const ordersForSelllers = async (req: Request, res: Response) => {
  const sellerId = req.params.id as string;
  if (!sellerId) {
    throw new Exception(400, 'Please provide the user_id');
  }
  const orders = await prisma.order.findMany({
    where: {
      product: {
        userId: sellerId,
      },
    },
  });
  res.status(HttpStatus.OK).json(orders);
};

const order = async (req: Request, res: Response) => {
  const order_id: string = req.params.id as string;
  if (!order_id) {
    throw new Exception(400, 'Please provide the order_id');
  }
  const order = await prisma.order.findUnique({ where: { id: order_id } });
  res.status(HttpStatus.OK).json(order);
};

const update = async (req: Request, res: Response) => {
  const order_id = req.params.id as string;
  const order = await prisma.order.findUnique({ where: { id: order_id } });
  if (!order_id) {
    throw new Exception(400, 'Please provide the order_id');
  }

  if (!order) {
    throw new Exception(404, 'Order not found');
  }
  const { status } = req.body;
  if (!status) {
    throw new Exception(400, 'Please provide the status');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order_id },
    data: {
      status: req.body.status,
    },
  });
  res.status(HttpStatus.OK).json(updatedOrder);
};

export default {
  ordersForUsers,
  orders,
  ordersForSelllers,
  order,
  update,
};
