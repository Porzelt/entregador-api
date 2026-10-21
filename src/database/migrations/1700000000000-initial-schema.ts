import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE couriers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL,
        email varchar(160) NOT NULL UNIQUE,
        password_hash varchar(100) NOT NULL,
        online boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`
      CREATE TABLE orders (
        id varchar(40) PRIMARY KEY,
        restaurant varchar(120) NOT NULL,
        address varchar(200) NOT NULL,
        fee numeric(10,2) NOT NULL CHECK (fee >= 0),
        distance_km numeric(6,2) NOT NULL CHECK (distance_km >= 0)
      )`);
    await q.query(`
      CREATE TABLE declined_orders (
        courier_id uuid NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
        order_id varchar(40) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (courier_id, order_id)
      )`);
    await q.query(`
      CREATE TABLE deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        courier_id uuid NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
        order_id varchar(40) NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
        status varchar(30) NOT NULL
          CHECK (status IN ('a_caminho_coleta','coletado','a_caminho_entrega','entregue')),
        completed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    // Garante no banco a regra "uma entrega ativa por vez", mesmo sob concorrência.
    await q.query(
      `CREATE UNIQUE INDEX uq_deliveries_one_active ON deliveries (courier_id) WHERE completed_at IS NULL`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE deliveries`);
    await q.query(`DROP TABLE declined_orders`);
    await q.query(`DROP TABLE orders`);
    await q.query(`DROP TABLE couriers`);
  }
}
