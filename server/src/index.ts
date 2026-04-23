import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { authMiddleware } from './middleware/auth.js';
import { adminMiddleware } from './middleware/admin.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';
import wishlistRoutes from './routes/wishlist.js';
import reviewRoutes from './routes/reviews.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import adminProductRoutes from './routes/admin/products.js';
import adminCategoryRoutes from './routes/admin/categories.js';
import adminOrderRoutes from './routes/admin/orders.js';
import adminUserRoutes from './routes/admin/users.js';
import adminInventoryRoutes from './routes/admin/inventory.js';
import stockAlertRoutes from './routes/admin/stockAlerts.js';
import adminShippingRoutes from './routes/admin/shipping.js';
import adminSupplierRoutes from './routes/admin/suppliers.js';
import adminSettingsRoutes from './routes/admin/settings.js';
import publicSettingsRoutes from './routes/public/settings.js';
import shippingCronRoutes from './routes/shippingCron.js';
import couponRoutes from './routes/coupons.js';
import pointsRoutes from './routes/points.js';
import rewardsRoutes from './routes/rewards.js';
import notificationRoutes from './routes/notifications.js';
import returnRoutes from './routes/returns.js';

const app = new Hono().basePath('/api/v1');

// Global middleware
app.use('*', corsMiddleware);
app.use('*', rateLimit(100, 60_000));
if (env.NODE_ENV !== 'production') {
  app.use('*', logger());
}

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes
app.route('/products', productRoutes);
app.route('/categories', categoryRoutes);
app.route('/auth', authRoutes);

app.route('/cart', cartRoutes);
app.route('/orders', orderRoutes);
app.route('/notifications', notificationRoutes);
app.route('/returns', returnRoutes);
app.route('/addresses', addressRoutes);
app.route('/wishlist', wishlistRoutes);
app.route('/reviews', reviewRoutes);
app.route('/payments', paymentRoutes);
app.route('/webhooks', webhookRoutes);
app.route('/settings', publicSettingsRoutes);
app.route('/coupons', couponRoutes);
app.route('/points', pointsRoutes);
app.route('/rewards', rewardsRoutes);

// Admin routes (auth + admin middleware)
const admin = new Hono();
admin.use('*', authMiddleware);
admin.use('*', adminMiddleware);
admin.route('/products', adminProductRoutes);
admin.route('/categories', adminCategoryRoutes);
admin.route('/orders', adminOrderRoutes);
admin.route('/users', adminUserRoutes);
admin.route('/inventory', adminInventoryRoutes);
admin.route('/shipping', adminShippingRoutes);
admin.route('/suppliers', adminSupplierRoutes);
admin.route('/settings', adminSettingsRoutes);
app.route('/admin', admin);

// Cron-protected routes (outside admin group — uses own auth)
app.route('/admin/stock-alerts', stockAlertRoutes);
app.route('/admin/shipments', shippingCronRoutes);

// Error handler
app.onError(errorHandler);

// Start server
serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`GenStore API running on http://localhost:${info.port}`);
});

export default app;
