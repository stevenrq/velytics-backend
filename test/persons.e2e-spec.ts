import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ADMIN_CREDENTIALS, createTestApp } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Persons (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let createdId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);
    adminToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a low-privilege user creating a person', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'responsable16', password: 'Passw0rd1!' })
      .expect(200);
    expect(login.body.user.authorities).toContain('user:read');
    expect(login.body.user.authorities).not.toContain('person:create');

    await request(app.getHttpServer())
      .post('/api/v1/persons')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        nationalId: '9990001',
        firstName: 'No',
        lastName: 'Permitido',
        email: 'no.permitido@velytics.local',
        phoneNumber: '3009990001',
      })
      .expect(403);
  });

  it('creates, lists, updates and deletes a person', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/persons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nationalId: '9990002',
        firstName: 'E2E',
        lastName: 'Test',
        email: 'e2e.persons@velytics.local',
        phoneNumber: '3009990002',
        address: { street: 'Calle Falsa', number: '123', city: 'Bogotá' },
      })
      .expect(201);
    createdId = create.body.id;
    expect(create.body.address.city).toBe('Bogotá');
    const addressId: number = create.body.address.id;

    const list = await request(app.getHttpServer())
      .get('/api/v1/persons')
      .query({ email: 'e2e.persons@velytics.local' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.meta.totalItems).toBe(1);

    const update = await request(app.getHttpServer())
      .put(`/api/v1/persons/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lastName: 'Actualizado' })
      .expect(200);
    expect(update.body.lastName).toBe('Actualizado');

    await request(app.getHttpServer())
      .patch(`/api/v1/persons/${createdId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: false })
      .expect(200)
      .expect(({ body }) => expect(body.enabled).toBe(false));

    await request(app.getHttpServer())
      .delete(`/api/v1/persons/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/persons/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    // Deleting a client must also clean up its (now-orphaned) address row;
    // Prisma has no orphan-removal cascade, so the service does it explicitly.
    const prisma = app.get(PrismaService);
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });
    expect(address).toBeNull();
  });
});
