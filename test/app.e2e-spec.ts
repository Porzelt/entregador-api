import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { seedDatabase } from '../src/database/seed';

const EMAIL = process.env.DEMO_COURIER_EMAIL!;
const PASSWORD = process.env.DEMO_COURIER_PASSWORD!;

async function ensureTestDatabase() {
  const admin = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'entregador',
    password: process.env.DB_PASSWORD ?? 'senha-falsa-dev',
    database: 'postgres',
  });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    process.env.DB_NAME,
  ]);
  if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
  await admin.end();
}

describe('API do entregador (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  const login = async () => {
    const res = await http()
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    token = res.body.accessToken;
  };
  const goOnline = (online = true) =>
    http().put('/courier/online').set(auth()).send({ online }).expect(200);
  const ids = async () =>
    (await http().get('/orders/available').set(auth()).expect(200)).body.map((o: any) => o.id);

  beforeAll(async () => {
    await ensureTestDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    ds = app.get(DataSource);
  });

  beforeEach(async () => {
    await ds.query('TRUNCATE deliveries, declined_orders, orders, couriers CASCADE');
    await seedDatabase(ds);
    await login();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('autenticação', () => {
    it('rejeita credenciais erradas e rotas sem token', async () => {
      await http().post('/auth/login').send({ email: EMAIL, password: 'errada' }).expect(401);
      await http().get('/orders/available').expect(401);
      await http().get('/orders/available').set('Authorization', 'Bearer invalido').expect(401);
    });

    it('valida o corpo do login com mensagens em português', async () => {
      const res = await http().post('/auth/login').send({ email: 'nao-e-email' }).expect(400);
      expect(res.body.message).toContain('Informe um e-mail válido.');
    });
  });

  describe('online/offline', () => {
    it('offline não recebe pedidos e não pode aceitar nem recusar', async () => {
      expect(await ids()).toEqual([]);
      const res = await http().post('/orders/ped-001/accept').set(auth()).expect(409);
      expect(res.body.message).toMatch(/online/);
      await http().post('/orders/ped-001/decline').set(auth()).expect(409);
    });

    it('online lista os pedidos de exemplo', async () => {
      await goOnline();
      const list = await ids();
      expect(list).toHaveLength(8);
    });

    it('valida o corpo de PUT /courier/online', async () => {
      await http().put('/courier/online').set(auth()).send({ online: 'sim' }).expect(400);
    });
  });

  describe('fluxo completo', () => {
    it('login, online, recusa, aceita, avança tudo, conclui, histórico e ganhos', async () => {
      await goOnline();

      // recusa ped-001 e ele some da lista
      await http().post('/orders/ped-001/decline').set(auth()).expect(200);
      expect(await ids()).not.toContain('ped-001');

      // aceita ped-002 (fee 12.00) e inicia a entrega
      const accepted = await http().post('/orders/ped-002/accept').set(auth()).expect(200);
      expect(accepted.body.status).toBe('a_caminho_coleta');
      expect(accepted.body.order).toMatchObject({ id: 'ped-002', fee: 12 });
      expect(await ids()).not.toContain('ped-002');

      const current = await http().get('/deliveries/current').set(auth()).expect(200);
      expect(current.body.id).toBe(accepted.body.id);

      // avança em ordem
      const seen: string[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await http().post('/deliveries/current/advance').set(auth()).expect(200);
        seen.push(res.body.status);
      }
      expect(seen).toEqual(['coletado', 'a_caminho_entrega', 'entregue']);

      // não passa de entregue
      await http().post('/deliveries/current/advance').set(auth()).expect(409);

      // conclui
      const done = await http().post('/deliveries/current/complete').set(auth()).expect(200);
      expect(done.body.completedAt).not.toBeNull();
      await http().get('/deliveries/current').set(auth()).expect(404);

      // segunda entrega, também concluída
      await http().post('/orders/ped-003/accept').set(auth()).expect(200);
      for (let i = 0; i < 3; i++)
        await http().post('/deliveries/current/advance').set(auth()).expect(200);
      await http().post('/deliveries/current/complete').set(auth()).expect(200);

      const history = await http().get('/deliveries/history').set(auth()).expect(200);
      expect(history.body.deliveries.map((d: any) => d.order.id)).toEqual(['ped-003', 'ped-002']);
      expect(history.body.deliveriesToday).toBe(2);
      expect(history.body.earningsToday).toBe(27.75); // 12.00 + 15.75
    });
  });

  describe('casos de erro', () => {
    beforeEach(goOnline);

    it('não aceita outro pedido com entrega ativa', async () => {
      await http().post('/orders/ped-001/accept').set(auth()).expect(200);
      const res = await http().post('/orders/ped-002/accept').set(auth()).expect(409);
      expect(res.body.message).toMatch(/entrega em andamento/);
    });

    it('não conclui antes de "entregue"', async () => {
      await http().post('/orders/ped-001/accept').set(auth()).expect(200);
      const res = await http().post('/deliveries/current/complete').set(auth()).expect(409);
      expect(res.body.message).toMatch(/entregue/);
      await http().post('/deliveries/current/advance').set(auth()).expect(200);
      await http().post('/deliveries/current/complete').set(auth()).expect(409);
    });

    it('pedido recusado não volta e não pode ser aceito', async () => {
      await http().post('/orders/ped-004/decline').set(auth()).expect(200);
      expect(await ids()).not.toContain('ped-004');
      await http().post('/orders/ped-004/accept').set(auth()).expect(409);
      // continua fora da lista depois de ficar offline e online de novo
      await goOnline(false);
      await goOnline(true);
      expect(await ids()).not.toContain('ped-004');
    });

    it('pedido inexistente devolve 404; sem entrega ativa, advance e complete devolvem 404', async () => {
      await http().post('/orders/nao-existe/accept').set(auth()).expect(404);
      await http().get('/deliveries/current').set(auth()).expect(404);
      await http().post('/deliveries/current/advance').set(auth()).expect(404);
      await http().post('/deliveries/current/complete').set(auth()).expect(404);
    });

    it('não recusa duas vezes o mesmo pedido', async () => {
      await http().post('/orders/ped-005/decline').set(auth()).expect(200);
      await http().post('/orders/ped-005/decline').set(auth()).expect(409);
    });
  });
});
