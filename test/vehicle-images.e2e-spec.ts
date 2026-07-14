import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ADMIN_CREDENTIALS, createTestApp } from './utils/test-app';

describe('Vehicle images upload size limit (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let vehicleId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);
    token = login.body.accessToken;

    const suffix = Date.now().toString().slice(-6);
    const createPurchase = await request(app.getHttpServer())
      .post('/api/v1/purchase-sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: 1,
        userId: 1,
        contractType: 'PURCHASE',
        contractStatus: 'PENDING',
        purchasePrice: 50_000_000,
        paymentLimitations: 'Sin cuotas',
        paymentTerms: 'Pago único',
        paymentMethod: 'CASH',
        vehicleData: {
          type: 'CAR',
          brand: 'Mazda',
          model: '3',
          line: 'Touring',
          capacity: 5,
          plate: `IMG-${suffix}`,
          motorNumber: `MTR-IMG-${suffix}`,
          serialNumber: `SER-IMG-${suffix}`,
          chassisNumber: `CHS-IMG-${suffix}`,
          color: 'Gris',
          cityRegistered: 'Medellín',
          year: 2021,
          mileage: 20000,
          transmission: 'AUTOMATICO',
          purchasePrice: 50_000_000,
          salePrice: 65_000_000,
          bodyType: 'SEDAN',
          fuelType: 'GASOLINA',
          numberOfDoors: 4,
        },
      })
      .expect(201);
    vehicleId = createPurchase.body.vehicleId;
  });

  afterAll(async () => {
    await app.close();
  });

  const MAX_SIZE = parseInt(
    process.env.S3_MAX_IMAGE_SIZE_BYTES ?? String(10 * 1024 * 1024),
    10,
  );

  it('rejects a presigned-upload request declaring a size over the max', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicleId}/images/presigned-upload`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'image/jpeg', size: MAX_SIZE + 1 })
      .expect(400);
  });

  it('accepts a presigned-upload request declaring a size within the max', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicleId}/images/presigned-upload`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contentType: 'image/jpeg', size: 1024 })
      .expect(201);
  });

  it('rejects a confirm-upload request declaring a size over the max', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicleId}/images/confirm-upload`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: 'too-big.jpg',
        contentType: 'image/jpeg',
        size: MAX_SIZE + 1,
        key: `vehicles/${vehicleId}/too-big.jpg`,
      })
      .expect(400);
  });
});
