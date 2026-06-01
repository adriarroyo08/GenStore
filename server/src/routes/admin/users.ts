import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';

const adminUsers = new Hono();

adminUsers.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, orders(count)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Get emails from auth (paginated to avoid memory exhaustion)
  const allUsers: Array<{ id: string; email?: string }> = [];
  let page = 1;
  while (true) {
    const { data: { users: batch } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    allUsers.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  const emailMap = new Map(allUsers.map(u => [u.id, u.email]));

  const result = (data ?? []).map((profile: any) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? '',
    order_count: profile.orders?.[0]?.count ?? 0,
    orders: undefined,
  }));

  return c.json({ users: result });
});

export default adminUsers;
