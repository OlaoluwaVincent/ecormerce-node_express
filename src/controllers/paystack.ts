import { paystackClient } from '../utils/paystack-config';
import { Request, Response } from 'express';
import {
  SuccessfulTransactionResponseData,
  UserRequest,
} from '../utils/typings';
import { Product } from '@prisma/client';
import prisma from '../../prisma/prisma';
import BadRequestException from '../exceptions/BadRequestException';
import { generateUniqueReference } from '../utils/token';
import { PAYMENT_STATUS } from '../exceptions/httpStatus';

const initPayment = async (req: UserRequest, res: Response) => {
  const customer = req.user;
  const products: Product[] = req.body.products;

  if (!products || products.length === 0) {
    throw new BadRequestException('Please provide the products to order');
  }

  const totalAmount = products.reduce((acc, pro) => {
    const discount = pro.discount ? (pro.price * pro.discount) / 100 : 0;
    const finalPrice = pro.price - discount;
    return acc + finalPrice;
  }, 0);

  const productsId = products.map((pro) => {
    return { id: pro.id, quantity: pro.quantity };
  });

  const paymentResults = await paystackClient.transaction.initialize({
    amount: totalAmount * 100, // Paystack expects amount in kobo
    email: customer!.email,
    name: customer!.username,
    reference: generateUniqueReference(),
    metadata: {
      productsId,
      customer: {
        email: customer?.email,
        id: customer?.id,
        username: customer?.username,
      },
    },
  });

  await prisma.transaction.create({
    data: {
      amount: totalAmount,
      transactionRef: paymentResults.data.reference,
      status: 'pending',
      user: {
        connect: { id: customer?.id },
      },
    },
  });

  res.status(200).json(paymentResults.data);
};

const verifyTransaction = async (req: Request, res: Response) => {
  const reference = req.params.id as string;

  if (!reference) {
    throw new BadRequestException('Please provide transaction reference');
  }

  const transaction = await paystackClient.transaction.verify(
    reference as string
  );

  if (transaction.data.status !== 'success') {
    throw new BadRequestException('Failed to finalize payment');
  }

  const transaction_data: SuccessfulTransactionResponseData = transaction.data;

  await prisma.transaction.update({
    where: {
      transactionRef: reference,
    },
    data: {
      status: 'success',
    },
  });

  // Create order items
  for (const productId of transaction_data.metadata.productsId) {
    await prisma.orderItem.create({
      data: {
        productId: productId.id,
        quantity: productId.quantity,
        userId: transaction_data.metadata.customer.id,
      },
    });
  }

  res.status(200).json({ message: 'Verified Successfully' });
};

export default { initPayment, verifyTransaction };
