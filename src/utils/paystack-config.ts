import config from './config';

// export const paystack_options = {
//   hostname: 'api.paystack.co',
//   port: 443,
//   path: '/transaction/initialize',
//   method: 'POST',
//   headers: {
//     Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
//     'Content-Type': 'application/json',
//   },
// };

import paystack from 'paystack';

export const paystackClient = paystack(config.PAYSTACK_SECRET_KEY!);
