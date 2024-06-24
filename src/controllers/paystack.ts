import { paystackClient } from '../utils/paystack-config';
import { Request, Response } from 'express';
import {
  SuccessfulTransactionResponseData,
  UserRequest,
} from '../utils/typings';
import { Product } from '@prisma/client';
import prisma from '../../prisma/prisma';
import NotFoundException from '../exceptions/NotFoundException';
import BadRequestException from '../exceptions/BadRequestException';
import { generateUniqueReference } from '../utils/token';
import { PAYMENT_STATUS } from '../exceptions/httpStatus';

const initPayment = async (req: UserRequest, res: Response) => {
  const customer = req.user;
  const products: Product[] = req.body.products;

  if (!products) {
    throw new BadRequestException('Please provide the products to Order');
  }

  const paymentPromises = products.map(async (product) => {
    const owner = await prisma.user.findUnique({
      where: { id: product.userId! },
    });
    if (!owner) {
      throw new NotFoundException('User does not exist');
    }
    const discount = product.discount
      ? (product.price / 100) * product.discount
      : product.price;

    const amount_in_kobo =
      (product.discount ? product.price - discount : product.price) * 100;

    return paystackClient.transaction.initialize({
      amount: amount_in_kobo,
      email: customer!.email,
      name: customer!.username,
      reference: generateUniqueReference(),
      metadata: {
        productId: product.id,
        customer: {
          email: customer?.email,
          id: customer?.id,
          username: customer?.username,
        },
      },
    });
  });

  const paymentResults = await Promise.all(paymentPromises);
  res.status(200).json({ success: true, data: paymentResults });
};

const verifyTransaction = async (req: Request, res: Response) => {
  const { reference, trxref } = req.query;
  if (!reference || !trxref) {
    throw new BadRequestException('Failed to finalize payment');
  }
  const transaction = await paystackClient.transaction.verify(
    reference as string
  );
  if (!transaction) {
    throw new BadRequestException('Failed to finalize payment');
  }

  const transaction_data: SuccessfulTransactionResponseData = transaction.data;

  if (transaction_data.status === 'success') {
  }

  const transactionTable = await prisma.transaction.create({
    data: {
      amount: transaction_data.amount / 100,
      channel: transaction_data.channel,
      customer_code: transaction_data.customer.customer_code,
      customerId: transaction_data.customer.id,
      paid_at: transaction_data.paid_at,
      productId: transaction_data.metadata.productId,
      status: transaction_data.status,
      transactionId: transaction_data.id,
      transactionRef: transaction_data.reference,
      userId: transaction_data.metadata.customer.id,
    },
  });

  const order = await prisma.order.create({
    data: {
      status: PAYMENT_STATUS.PENDING,
      totalAmount: transaction_data.amount / 100,
      orderDate: transaction_data.paid_at,
      productId: transaction_data.metadata.productId,
      userId: transaction_data.metadata.customer.id,
      transactionId: transactionTable.id,
    },
  });

  res.status(200).json({ success: true, data: order });
};

export default { initPayment, verifyTransaction };
