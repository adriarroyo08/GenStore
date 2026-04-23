import { Hono } from 'hono';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import * as paymentService from '../services/paymentService.js';
import type Stripe from 'stripe';

const webhooks = new Hono();

// POST /webhooks/stripe
// NO auth middleware — Stripe verifies via signature
webhooks.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  // Read raw body for signature verification
  const rawBody = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Webhook signature error:', message);
    return c.json({ error: message }, 400);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentService.handlePaymentSuccess(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentService.handlePaymentFailure(paymentIntent);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await paymentService.handleRefundCompleted(charge);
        break;
      }
      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook ${event.type}:`, err);
    // Return 200 anyway to prevent Stripe from retrying
    // The error is logged for investigation
  }

  return c.json({ received: true });
});

export default webhooks;
