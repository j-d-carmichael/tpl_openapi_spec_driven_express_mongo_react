import config from '@/config';
import express from 'express';
import authRoutes from '@/services/AuthRoutesService';
import healthRoutes from './routes/healthRoutes';
import userRoutes from './routes/userRoutes';

export interface RoutesImporter {
  basePath?: string
}

export const baseUrl = '/api';

export default function (app: express.Application, options: RoutesImporter = {basePath: baseUrl}) {
  const basePath = (options.basePath || '').replace(/\/+$/, '');

  // WorkOS AuthKit routes (login, callback, logout)
  app.use(basePath + '/auth', authRoutes);

  app.use(basePath + '/health', healthRoutes());

  app.use(basePath + '/user', userRoutes());

  }
