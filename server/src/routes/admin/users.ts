import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';

const adminUsers = new Hono();

adminUsers.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, orders(count)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Get emails from auth
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const emailMap = new Map(users.map(u => [u.id, u.email]));

  const result = (data ?? []).map((profile: any) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? '',
    order_count: profile.orders?.[0]?.count ?? 0,
    orders: undefined,
  }));

  return c.json({ users: result });
});

export default adminUsers;
