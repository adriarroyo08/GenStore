import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import * as cartService from '../services/cartService.js';
import type { AppEnv } from '../middleware/auth.js';

const cart = new Hono<AppEnv>();
cart.use('*', authMiddleware);

cart.get('/', async (c) => {
  const user = c.get('user');
  const items = await cartService.getCart(user.id);
  return c.json(items);
});

cart.post('/', async (c) => {
  const user = c.get('user');
  const { productId, cantidad = 1, opciones = {} } = await c.req.json();
  if (!productId) return c.json({ error: 'productId requerido' }, 400);
  const item = await cartService.addToCart(user.id, productId, cantidad, opciones);
  return c.json(item, 201);
});

cart.put('/:id', async (c) => {
  const user = c.get('user');
  const { cantidad } = await c.req.json();
  if (!cantidad || cantidad < 1) return c.json({ error: 'Cantidad debe ser mayor a 0' }, 400);
  const item = await cartService.updateCartItem(user.id, c.req.param('id'), cantidad);
  return c.json(item);
});

cart.delete('/:id', async (c) => {
  const user = c.get('user');
  await cartService.removeCartItem(user.id, c.req.param('id'));
  return c.json({ message: 'Item eliminado' });
});

cart.delete('/', async (c) => {
  const user = c.get('user');
  await cartService.clearCart(user.id);
  return c.json({ message: 'Carrito vaciado' });
});

export default cart;
