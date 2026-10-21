import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Pedido recusado por um entregador; não volta a aparecer para ele. */
@Entity('declined_orders')
export class DeclinedOrderEntity {
  @PrimaryColumn({ name: 'courier_id', type: 'uuid' })
  courierId: string;

  @PrimaryColumn({ name: 'order_id', length: 40 })
  orderId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
