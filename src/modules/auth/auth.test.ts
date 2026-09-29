import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requireRole } from './auth.middleware.js';
import { errorHandler } from '../../common/error-handler.js';

describe('Auth Module Integration Tests', () => {
  const app = createApp();
  const testRunId = Date.now();
  const passengerEmail = `passenger_${testRunId}@dhakatesla.com`;
  const driverEmail = `driver_${testRunId}@dhakatesla.com`;
  const password = 'SecurePassword123!';

  let passengerToken: string;
  let driverToken: string;

  beforeAll(async () => {
    // Clean up test users if they exist
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'dhakatesla.com',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'dhakatesla.com',
        },
      },
    });
  });

  describe('POST /api/auth/sign-up', () => {
    it('should register a new PASSENGER successfully', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'Rahim Uddin',
          email: passengerEmail,
          password: password,
          role: 'PASSENGER',
          phone: '+8801711000001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(passengerEmail);
      expect(res.body.data.user.role).toBe('PASSENGER');
      expect(res.body.data.token).toBeDefined();

      passengerToken = res.body.data.token;
    });

    it('should register a new DRIVER successfully', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'Karim Driver',
          email: driverEmail,
          password: password,
          role: 'DRIVER',
          phone: '+8801711000002',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('DRIVER');
      expect(res.body.data.token).toBeDefined();

      driverToken = res.body.data.token;
    });

    it('should reject registration with duplicate email (409)', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'Duplicate Rahim',
          email: passengerEmail,
          password: password,
          role: 'PASSENGER',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE');
    });

    it('should reject registration with short password (400)', async () => {
      const res = await request(app)
        .post('/api/auth/sign-up')
        .send({
          name: 'Short Pass',
          email: `short_${testRunId}@dhakatesla.com`,
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/sign-in', () => {
    it('should authenticate with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: passengerEmail,
          password: password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(passengerEmail);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject authentication with invalid password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/sign-in')
        .send({
          email: passengerEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return user details when valid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(passengerEmail);
      expect(res.body.data.user.role).toBe('PASSENGER');
    });

    it('should return driver details when driver Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(driverEmail);
      expect(res.body.data.user.role).toBe('DRIVER');
    });
  });

  describe('Role-based access control (requireRole)', () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/driver-only', requireAuth, requireRole('DRIVER'), (_req, res) => {
      res.json({ success: true, message: 'Welcome Driver' });
    });
    testApp.use(errorHandler);

    it('should deny passenger access to a driver-only route (403)', async () => {
      const res = await request(testApp)
        .get('/driver-only')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow driver access to a driver-only route (200)', async () => {
      const res = await request(testApp)
        .get('/driver-only')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome Driver');
    });
  });

  describe('POST /api/auth/sign-out', () => {
    it('should sign out successfully with token', async () => {
      const res = await request(app)
        .post('/api/auth/sign-out')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
