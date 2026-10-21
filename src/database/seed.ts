import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { CourierEntity } from '../couriers/courier.entity';
import { OrderEntity } from '../orders/order.entity';

/** Restaurantes e endereços fictícios, só para demonstração. */
export const SAMPLE_ORDERS: OrderEntity[] = [
  {
    id: 'ped-001',
    restaurant: 'Pizzaria Boa Massa',
    address: 'Rua das Flores, 120',
    fee: 8.5,
    distanceKm: 2.4,
  },
  {
    id: 'ped-002',
    restaurant: 'Hambúrguer do Bairro',
    address: 'Av. Central, 842',
    fee: 12.0,
    distanceKm: 3.8,
  },
  {
    id: 'ped-003',
    restaurant: 'Sushi Exemplo',
    address: 'Rua do Comércio, 55',
    fee: 15.75,
    distanceKm: 5.1,
  },
  {
    id: 'ped-004',
    restaurant: 'Padaria Pão Quente',
    address: 'Travessa da Paz, 9',
    fee: 6.0,
    distanceKm: 1.2,
  },
  {
    id: 'ped-005',
    restaurant: 'Marmitaria Sabor Caseiro',
    address: 'Rua Nova, 301',
    fee: 9.9,
    distanceKm: 2.9,
  },
  {
    id: 'ped-006',
    restaurant: 'Açaí da Praça',
    address: 'Praça Principal, 4',
    fee: 7.25,
    distanceKm: 1.8,
  },
  {
    id: 'ped-007',
    restaurant: 'Churrascaria Exemplo',
    address: 'Av. das Palmeiras, 1500',
    fee: 18.4,
    distanceKm: 6.3,
  },
  {
    id: 'ped-008',
    restaurant: 'Doceria Açúcar & Afeto',
    address: 'Rua dos Ipês, 77',
    fee: 10.2,
    distanceKm: 3.0,
  },
];

/** Idempotente: pode rodar várias vezes sem duplicar dados. */
export async function seedDatabase(ds: DataSource, env: NodeJS.ProcessEnv = process.env) {
  const email = (env.DEMO_COURIER_EMAIL ?? 'entregador@example.com').toLowerCase();
  const password = env.DEMO_COURIER_PASSWORD ?? 'demo-senha-falsa';
  const name = env.DEMO_COURIER_NAME ?? 'Entregador Demo';

  const couriers = ds.getRepository(CourierEntity);
  if (!(await couriers.existsBy({ email }))) {
    await couriers.save(
      couriers.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        online: false,
      }),
    );
  }
  await ds
    .getRepository(OrderEntity)
    .createQueryBuilder()
    .insert()
    .values(SAMPLE_ORDERS)
    .orIgnore()
    .execute();
}
