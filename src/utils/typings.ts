import { Request } from 'express';

export interface UserType extends UserTokenType {
  hashedPassword: string;
}

export interface UserTokenType {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  exp: number;
}

export interface UserRequest extends Request {
  user?: UserTokenType;
  file?: Express.Multer.File;
  // files?: Array<Express.Multer.File>;
}

export interface CloudinaryImages {
  url: string;
  public_id: string;
}

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}
export interface SuccessfulTransactionResponse {
  success: boolean;
  data: {
    status: boolean;
    message: string;
    data: SuccessfulTransactionResponseData;
  };
}

export interface SuccessfulTransactionResponseData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  receipt_number: string | null;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: {
    productId: string;
    customer: {
      email: string;
      id: string;
      username: string;
    };
  };
  log: {
    start_time: number;
    time_spent: number;
    attempts: number;
    errors: number;
    success: boolean;
    mobile: boolean;
    input: any[];
    history: {
      type: string;
      message: string;
      time: number;
    }[];
  };
  fees: number;
  fees_split: any | null;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string;
    account_name: string | null;
    receiver_bank_account_number: string | null;
    receiver_bank: string | null;
  };
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: any | null;
    risk_action: string;
    international_format_phone: string | null;
  };
  plan: any | null;
  split: any | null;
  order_id: string | null;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: any | null;
  source: any | null;
  fees_breakdown: any | null;
  connect: any | null;
  transaction_date: string;
  plan_object: any | null;
  subaccount: any | null;
}
export interface UnsuccessfulTransactionResponse {
  status: boolean;
  message: string;
  error: {
    code: string;
    message: string;
  };
}

export interface IPaystackBank {
  name: string;
  code: string;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}
