import { DataSourceOptions } from 'typeorm';
import { CourierEntity } from '../couriers/courier.entity';
import { OrderEntity } from '../orders/order.entity';
import { DeclinedOrderEntity } from '../orders/declined-order.entity';
import { DeliveryEntity } from '../deliveries/delivery.entity';
import { InitialSchema1700000000000 } from '../database/migrations/1700000000000-initial-schema';

export function dataSourceOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'entregador',
    password: env.DB_PASSWORD ?? 'senha-falsa-dev',
    database: env.DB_NAME ?? 'entregador',
    entities: [CourierEntity, OrderEntity, DeclinedOrderEntity, DeliveryEntity],
    migrations: [InitialSchema1700000000000],
    synchronize: false,
  };
}

export function jwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  return env.JWT_SECRET ?? 'segredo-falso-apenas-para-desenvolvimento';
}
