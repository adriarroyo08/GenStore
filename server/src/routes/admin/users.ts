import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';

const adminUsers = new Hono();

adminUsers.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const pageSize = Math.min(Number(c.req.query('pageSize') ?? 50), 100);
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabaseAdmin
    .from('profiles')
    .select('*, orders(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  // Get emails from auth (paginated to avoid memory exhaustion)
  const allUsers: Array<{ id: string; email?: string }> = [];
  let authPage = 1;
  while (true) {
    const { data: { users: batch } } = await supabaseAdmin.auth.admin.listUsers({ page: authPage, perPage: 100 });
    allUsers.push(...batch);
    if (batch.length < 100) break;
    authPage++;
  }
  const emailMap = new Map(allUsers.map(u => [u.id, u.email]));

  const result = (data ?? []).map((profile: any) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? '',
    order_count: profile.orders?.[0]?.count ?? 0,
    orders: undefined,
  }));

  return c.json({ users: result, total: count ?? 0, page, pageSize });
});

export default adminUsers;
