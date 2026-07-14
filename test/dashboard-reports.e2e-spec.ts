import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ADMIN_CREDENTIALS, createTestApp } from './utils/test-app';

describe('Dashboard & reports (e2e)', () => {
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

  it('returns the dashboard summary (and route ordering does not shadow it with :id)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/purchase-sales/dashboard-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.globalMetrics.totalContracts).toBeGreaterThan(0);
    expect(res.body.vehicleCounts).toBeDefined();
  });

  it('exports a CSV report (route ordering does not shadow /report/:format with :id)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/purchase-sales/report/csv')
      .query({ startDate: '2026-01-01', endDate: '2026-12-31' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.split('\n')[0]).toContain('ID,Tipo,Estado');
  });

  it('rejects an invalid report format', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/purchase-sales/report/xml')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('resolves /purchase-sales/available-vehicles as a static route, not :id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/purchase-sales/available-vehicles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
