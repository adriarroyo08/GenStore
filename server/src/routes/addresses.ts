import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { AppEnv } from '../middleware/auth.js';

const addresses = new Hono<AppEnv>();
addresses.use('*', authMiddleware);

addresses.get('/', async (c) => {
  const user = c.get('user');
  const { data, error } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  if (error) throw new Error(error.message);
  return c.json(data);
});

addresses.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { tipo, nombre, calle, ciudad, codigo_postal, provincia, pais, is_default } = body;

  if (!nombre || !calle || !ciudad || !codigo_postal || !provincia) {
    return c.json({ error: 'Todos los campos de dirección son requeridos' }, 400);
  }

  // If setting as default, unset other defaults of same type
  if (is_default) {
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('tipo', tipo ?? 'shipping');
  }

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .insert({ user_id: user.id, tipo: tipo ?? 'shipping', nombre, calle, ciudad, codigo_postal, provincia, pais: pais ?? 'ES', is_default: is_default ?? false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data, 201);
});

addresses.put('/:id', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  if (body.is_default) {
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('tipo', body.tipo ?? 'shipping');
  }

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return c.json(data);
});

addresses.delete('/:id', async (c) => {
  const user = c.get('user');
  const { error } = await supabaseAdmin
    .from('addresses')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  return c.json({ message: 'Dirección eliminada' });
});

export default addresses;
