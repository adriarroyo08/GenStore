import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { AppEnv } from '../middleware/auth.js';

const wishlist = new Hono<AppEnv>();
wishlist.use('*', authMiddleware);

wishlist.get('/', async (c) => {
  const user = c.get('user');
  const { data, error } = await supabaseAdmin
    .from('wishlist_items')
    .select('*, product:products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return c.json(data);
});

wishlist.post('/:productId', async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');

  const { data, error } = await supabaseAdmin
    .from('wishlist_items')
    .upsert({ user_id: user.id, product_id: productId }, { onConflict: 'user_id,product_id' })
    .select('*, product:products(*)')
    .single();

  if (error) throw new Error(error.message);
  return c.json(data, 201);
});

wishlist.delete('/:productId', async (c) => {
  const user = c.get('user');
  const { error } = await supabaseAdmin
    .from('wishlist_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', c.req.param('productId'));

  if (error) throw new Error(error.message);
  return c.json({ message: 'Eliminado de la lista de deseos' });
});

export default wishlist;
