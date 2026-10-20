import { Hono } from 'hono';
import { supabaseAdmin } from '../../config/supabase.js';

const adminUsers = new Hono();

adminUsers.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? 1) || 1);
  const pageSize = Math.min(Number(c.req.query('pageSize') ?? 50), 100);
  const from = (page - 1) * pageSize;

  const { data, count, error } = await supabaseAdmin
    .from('profiles')
    .select('*, orders(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(error.message);

  // Get emails only for users on the current page
  const profileIds = (data ?? []).map((p: any) => p.id as string);
  const emailMap = new Map<string, string>();
  for (const id of profileIds) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(id);
      if (user?.email) emailMap.set(id, user.email);
    } catch {
      // Skip if user not found in auth
    }
  }

  const result = (data ?? []).map((profile: any) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? '',
    order_count: profile.orders?.[0]?.count ?? 0,
    orders: undefined,
  }));

  return c.json({ users: result, total: count ?? 0, page, pageSize });
});

export default adminUsers;
