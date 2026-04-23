import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as couponService from '../services/couponService.js';
import type { AppEnv } from '../middleware/auth.js';

const coupons = new Hono<AppEnv>();
coupons.use('*', authMiddleware);

// POST /coupons/validate — validate a coupon code and return discount
coupons.post('/validate', async (c) => {
  const user = c.get('user');
  const { code, subtotal } = await c.req.json();

  if (!code || typeof code !== 'string') {
    return c.json({ error: 'Código de cupón requerido' }, 400);
  }
  if (!subtotal || typeof subtotal !== 'number' || subtotal <= 0) {
    return c.json({ error: 'Subtotal inválido' }, 400);
  }

  try {
    const result = await couponService.validateCoupon(code, user.id, subtotal);
    return c.json(result);
  } catch {
    return c.json({ valid: false, error: 'Código de descuento no válido' });
  }
});

export default coupons;
