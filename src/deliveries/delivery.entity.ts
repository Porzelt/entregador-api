import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from '../orders/order.entity';
import { DeliveryStatus } from './domain/delivery-status';

@Entity('deliveries')
export class DeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'courier_id', type: 'uuid' })
  courierId: string;

  @Column({ name: 'order_id', length: 40, unique: true })
  orderId: string;

  @ManyToOne(() => OrderEntity, { eager: true })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ type: 'varchar', length: 30 })
  status: DeliveryStatus;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
