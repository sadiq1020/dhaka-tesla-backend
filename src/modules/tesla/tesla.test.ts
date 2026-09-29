import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../db/prisma.js';

describe('Tesla Fleet Management Integration Tests', () => {
  const app = createApp();
  const testRunId = Date.now();
  const driverEmail = `tesla_driver_${testRunId}@dhakatesla.com`;
  const passengerEmail = `tesla_passenger_${testRunId}@dhakatesla.com`;
  const password = 'SecurePassword123!';

  let driverToken: string;
  let passengerToken: string;
  const plateNumber = `DHK-METRO-LA-${testRunId.toString().slice(-4)}`;

  beforeAll(async () => {
    // 1. Create a driver user
    const driverRes = await request(app).post('/api/auth/sign-up').send({
      name: 'Salim Driver',
      email: driverEmail,
      password,
      role: 'DRIVER',
      phone: '+8801811000001',
    });
    driverToken = driverRes.body.data.token;

    // 2. Create a passenger user
    const passengerRes = await request(app).post('/api/auth/sign-up').send({
      name: 'Sadia Passenger',
      email: passengerEmail,
      password,
      role: 'PASSENGER',
      phone: '+8801811000002',
    });
    passengerToken = passengerRes.body.data.token;
  });

  afterAll(async () => {
    // Cleanup created teslas and users
    await prisma.tesla.deleteMany({
      where: {
        driver: {
          email: {
            contains: `${testRunId}@dhakatesla.com`,
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: `${testRunId}@dhakatesla.com`,
        },
      },
    });
  });

  describe('POST /api/teslas', () => {
    it('should reject Tesla registration from a PASSENGER (403)', async () => {
      const res = await request(app)
        .post('/api/teslas')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          name: 'Model 3 Passenger',
          plateNumber: `PASS-${testRunId.toString().slice(-4)}`,
          capacity: 4,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject registration with invalid capacity < 2 (400)', async () => {
      const res = await request(app)
        .post('/api/teslas')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          name: 'Tiny Tesla',
          plateNumber: `TINY-${testRunId.toString().slice(-4)}`,
          capacity: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid capacity > 4 (400)', async () => {
      const res = await request(app)
        .post('/api/teslas')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          name: 'Big Tesla',
          plateNumber: `BIG-${testRunId.toString().slice(-4)}`,
          capacity: 7,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should register a Tesla successfully for a DRIVER (201)', async () => {
      const res = await request(app)
        .post('/api/teslas')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          name: 'White Lightning',
          plateNumber,
          capacity: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('White Lightning');
      expect(res.body.data.plateNumber).toBe(plateNumber);
      expect(res.body.data.capacity).toBe(4);
      expect(res.body.data.isOnline).toBe(false);
    });

    it('should reject registering a second Tesla for the same driver (409)', async () => {
      const res = await request(app)
        .post('/api/teslas')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          name: 'Second Tesla',
          plateNumber: `SEC-${testRunId.toString().slice(-4)}`,
          capacity: 4,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE');
    });
  });

  describe('GET /api/teslas/my', () => {
    it('should return the driver’s registered Tesla (200)', async () => {
      const res = await request(app)
        .get('/api/teslas/my')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plateNumber).toBe(plateNumber);
    });

    it('should reject a passenger accessing /api/teslas/my (403)', async () => {
      const res = await request(app)
        .get('/api/teslas/my')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/teslas/status', () => {
    it('should toggle Tesla online status to true (200)', async () => {
      const res = await request(app)
        .patch('/api/teslas/status')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ isOnline: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isOnline).toBe(true);
    });

    it('should reflect online status in GET /api/teslas', async () => {
      const res = await request(app)
        .get('/api/teslas')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find(
        (t: { plateNumber: string }) => t.plateNumber === plateNumber,
      );
      expect(found).toBeDefined();
      expect(found.isOnline).toBe(true);
    });

    it('should toggle Tesla online status back to false (200)', async () => {
      const res = await request(app)
        .patch('/api/teslas/status')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ isOnline: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isOnline).toBe(false);
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return driver profile including their Tesla vehicle', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(driverEmail);
      expect(res.body.data.role).toBe('DRIVER');
      expect(res.body.data.tesla).toBeDefined();
      expect(res.body.data.tesla.plateNumber).toBe(plateNumber);
    });

    it('should return passenger profile with null tesla', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(passengerEmail);
      expect(res.body.data.role).toBe('PASSENGER');
      expect(res.body.data.tesla).toBeNull();
    });
  });
});
