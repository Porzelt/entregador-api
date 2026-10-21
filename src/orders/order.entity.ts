import { Column, Entity, PrimaryColumn } from 'typeorm';

const numeric = { to: (v: number) => v, from: (v: string) => Number(v) };

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn({ length: 40 })
  id: string;

  @Column({ length: 120 })
  restaurant: string;

  @Column({ length: 200 })
  address: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numeric })
  fee: number;

  @Column({ name: 'distance_km', type: 'numeric', precision: 6, scale: 2, transformer: numeric })
  distanceKm: number;
}
