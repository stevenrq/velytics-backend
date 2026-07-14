import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ADMIN_CREDENTIALS, createTestApp } from './utils/test-app';

describe('Purchase-sales lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('runs the full purchase -> sale -> cancel lifecycle with vehicle status sync', async () => {
    const suffix = Date.now().toString().slice(-6);

    const createPurchase = await request(app.getHttpServer())
      .post('/api/v1/purchase-sales')
      .set(auth())
      .send({
        clientId: 1,
        userId: 1,
        contractType: 'PURCHASE',
        contractStatus: 'PENDING',
        purchasePrice: 58_000_000,
        paymentLimitations: 'Sin cuotas',
        paymentTerms: 'Pago único',
        paymentMethod: 'CASH',
        vehicleData: {
          type: 'CAR',
          brand: 'Toyota',
          model: 'Corolla',
          line: 'XEI',
          capacity: 5,
          plate: `E2E-${suffix}`,
          motorNumber: `MTR-E2E-${suffix}`,
          serialNumber: `SER-E2E-${suffix}`,
          chassisNumber: `CHS-E2E-${suffix}`,
          color: 'Blanco',
          cityRegistered: 'Bogotá',
          year: 2022,
          mileage: 15000,
          transmission: 'AUTOMATICO',
          purchasePrice: 58_000_000,
          salePrice: 75_000_000,
          bodyType: 'SEDAN',
          fuelType: 'GASOLINA',
          numberOfDoors: 4,
        },
      })
      .expect(201);

    const vehicleId = createPurchase.body.vehicleId;
    const purchaseId = createPurchase.body.id;
    expect(vehicleId).toBeDefined();

    const carAfterCreate = await request(app.getHttpServer())
      .get(`/api/v1/cars/${vehicleId}`)
      .set(auth())
      .expect(200);
    expect(carAfterCreate.body.status).toBe('AVAILABLE');

    // A second PENDING/ACTIVE purchase for the same vehicle is rejected.
    await request(app.getHttpServer())
      .post('/api/v1/purchase-sales')
      .set(auth())
      .send({
        clientId: 1,
        userId: 1,
        vehicleId,
        contractType: 'PURCHASE',
        purchasePrice: 1,
        paymentLimitations: 'x',
        paymentTerms: 'x',
        paymentMethod: 'CASH',
      })
      .expect(409);

    await request(app.getHttpServer())
      .put(`/api/v1/purchase-sales/${purchaseId}`)
      .set(auth())
      .send({ contractStatus: 'ACTIVE' })
      .expect(200);

    const createSale = await request(app.getHttpServer())
      .post('/api/v1/purchase-sales')
      .set(auth())
      .send({
        clientId: 2,
        userId: 1,
        vehicleId,
        contractType: 'SALE',
        contractStatus: 'PENDING',
        purchasePrice: 1,
        salePrice: 80_000_000,
        paymentLimitations: 'Sin cuotas',
        paymentTerms: 'Pago único',
        paymentMethod: 'CASH',
      })
      .expect(201);
    // purchasePrice must be overwritten from the ACTIVE purchase, not the submitted 1.
    expect(createSale.body.purchasePrice).toBe(58_000_000);
    const saleId = createSale.body.id;

    await request(app.getHttpServer())
      .put(`/api/v1/purchase-sales/${saleId}`)
      .set(auth())
      .send({ contractStatus: 'COMPLETED' })
      .expect(200);

    const carAfterSale = await request(app.getHttpServer())
      .get(`/api/v1/cars/${vehicleId}`)
      .set(auth())
      .expect(200);
    expect(carAfterSale.body.status).toBe('SOLD');

    await request(app.getHttpServer())
      .put(`/api/v1/purchase-sales/${saleId}`)
      .set(auth())
      .send({ contractStatus: 'CANCELED' })
      .expect(200);

    const carAfterCancel = await request(app.getHttpServer())
      .get(`/api/v1/cars/${vehicleId}`)
      .set(auth())
      .expect(200);
    expect(carAfterCancel.body.status).toBe('AVAILABLE');

    // Cannot delete a non-CANCELED contract.
    await request(app.getHttpServer())
      .delete(`/api/v1/purchase-sales/${purchaseId}`)
      .set(auth())
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/api/v1/purchase-sales/${saleId}`)
      .set(auth())
      .expect(204);

    const history = await request(app.getHttpServer())
      .get(`/api/v1/purchase-sales/${purchaseId}/status-history`)
      .set(auth())
      .expect(200);
    expect(history.body.length).toBeGreaterThanOrEqual(2);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/purchase-sales/${purchaseId}`)
      .set(auth())
      .expect(200);
    expect(detail.body.clientSummary).toBeDefined();
    expect(detail.body.vehicleSummary).toBeDefined();

    // ML can pull the same list via the shared service key, without a JWT.
    await request(app.getHttpServer())
      .get('/api/v1/purchase-sales')
      .query({ limit: 5 })
      .set('X-Service-Key', process.env.SERVICE_API_KEY as string)
      .expect(200);

    // cleanup
    await request(app.getHttpServer())
      .put(`/api/v1/purchase-sales/${purchaseId}`)
      .set(auth())
      .send({ contractStatus: 'CANCELED' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/purchase-sales/${purchaseId}`)
      .set(auth())
      .expect(204);
  });

  it('rejects an embedded vehicle with purchasePrice <= 0, even for a CANCELED contract', async () => {
    const suffix = Date.now().toString().slice(-6);
    await request(app.getHttpServer())
      .post('/api/v1/purchase-sales')
      .set(auth())
      .send({
        clientId: 1,
        userId: 1,
        contractType: 'PURCHASE',
        contractStatus: 'CANCELED',
        purchasePrice: 0,
        paymentLimitations: 'x',
        paymentTerms: 'x',
        paymentMethod: 'CASH',
        vehicleData: {
          type: 'CAR',
          brand: 'ZeroPrice',
          model: 'M',
          line: 'L',
          capacity: 5,
          plate: `E2E-${suffix}`,
          motorNumber: `MTR-E2E-${suffix}`,
          serialNumber: `SER-E2E-${suffix}`,
          chassisNumber: `CHS-E2E-${suffix}`,
          color: 'Blanco',
          cityRegistered: 'Bogotá',
          year: 2022,
          mileage: 1,
          transmission: 'MANUAL',
          purchasePrice: 0,
          salePrice: 0,
          bodyType: 'SEDAN',
          fuelType: 'GASOLINA',
          numberOfDoors: 4,
        },
      })
      .expect(422);
  });

  it('matches contractStatus via partial/substring term search', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/purchase-sales')
      .query({ term: 'pend', limit: 5 })
      .set(auth())
      .expect(200);
    expect(res.body.meta.totalItems).toBeGreaterThan(0);
    for (const row of res.body.data) {
      expect(row.contractStatus).toBe('PENDING');
    }
  });
});
