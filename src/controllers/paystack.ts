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
import { ORDER_STATUS } from '../exceptions/httpStatus';
import { createHmac } from 'crypto';
import config from '../utils/config';
import UnauthorizedException from '../exceptions/UnauthorizedException';

const initPayment = async (req: UserRequest, res: Response) => {
  interface Pro extends Product {
    originalQuantity: number;
  }
  const customer = req.user;
  const products: Pro[] = req.body.products;

  if (!products || products.length === 0) {
    throw new BadRequestException('Please provide the products to order');
  }
  const totalAmount = products.reduce((acc, pro) => {
    const discount = pro.discount ? (pro.price * pro.discount) / 100 : 0;
    const finalPrice = pro.price - discount;
    if (pro.originalQuantity) {
      return (acc + finalPrice) * pro.originalQuantity;
    }
    return acc + finalPrice;
  }, 0);

  const productsId = products.map((pro) => {
    return { id: pro.id, quantity: Number(pro.quantity) };
  });

  const reference = generateUniqueReference();

  const paymentResults = await paystackClient.transaction.initialize({
    amount: totalAmount * 100, // Paystack expects amount in kobo
    email: customer!.email,
    name: customer!.username,
    reference: reference,
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
  const hash = createHmac('sha512', config.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest('hex');

  const isVerified = hash === req.headers['x-paystack-signature'];

  if (!isVerified)
    throw new UnauthorizedException('Failed to validate headers');
  // Process the event
  const event = req.body as {
    event: string;
    data: SuccessfulTransactionResponseData;
  };

  switch (event.event) {
    case 'charge.success':
      // handlde Updates
      const transaction = await prisma.transaction.update({
        where: {
          transactionRef: event.data.reference,
        },
        data: {
          status: event.data.status,
          channel: event.data.channel,
          paid_at: event.data.paid_at,
        },
      });

      for (const productId of event.data.metadata.productsId) {
        try {
          await prisma.orderItem.create({
            data: {
              productId: productId.id,
              quantity: Number(productId.quantity),
              userId: event.data.metadata.customer.id,
              deliveryStatus: ORDER_STATUS.PENDING,
            },
          });
        } catch (error) {
          console.log(error);
        }
      }
      res.end();

      break;
    default:
      throw new Error('Invalid event received');
  }
};

export default { initPayment, verifyTransaction };
