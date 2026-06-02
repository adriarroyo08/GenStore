import { cors } from 'hono/cors';
import { env } from '../config/env.js';

const allowedOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3005', 'https://genstore.automatito.win'];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
