import { stripe } from '../config/stripe.js';

interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export async function listPaymentMethods(stripeCustomerId: string): Promise<SavedPaymentMethod[]> {
  const methods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: 'card',
  });

  return methods.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand ?? 'unknown',
    last4: pm.card?.last4 ?? '????',
    expMonth: pm.card?.exp_month ?? 0,
    expYear: pm.card?.exp_year ?? 0,
  }));
}

export async function attachPaymentMethod(
  stripeCustomerId: string,
  paymentMethodId: string
): Promise<SavedPaymentMethod> {
  const pm = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: stripeCustomerId,
  });

  return {
    id: pm.id,
    brand: pm.card?.brand ?? 'unknown',
    last4: pm.card?.last4 ?? '????',
    expMonth: pm.card?.exp_month ?? 0,
    expYear: pm.card?.exp_year ?? 0,
  };
}

export async function detachPaymentMethod(paymentMethodId: string): Promise<void> {
  await stripe.paymentMethods.detach(paymentMethodId);
}
