import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { DeliveryEntity } from './delivery.entity';
import { toDeliveryView } from './delivery.view';
import {
  advanceStatus,
  assertCanComplete,
  dayBounds,
  totalEarnings,
} from './domain/delivery-status';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(DeliveryEntity) private readonly repo: Repository<DeliveryEntity>,
  ) {}

  private async activeOrFail(courierId: string): Promise<DeliveryEntity> {
    const delivery = await this.repo.findOne({ where: { courierId, completedAt: IsNull() } });
    if (!delivery) throw new NotFoundException('Nenhuma entrega em andamento.');
    return delivery;
  }

  async current(courierId: string) {
    return toDeliveryView(await this.activeOrFail(courierId));
  }

  async advance(courierId: string) {
    const delivery = await this.activeOrFail(courierId);
    delivery.status = advanceStatus(delivery.status);
    return toDeliveryView(await this.repo.save(delivery));
  }

  async complete(courierId: string, now: Date = new Date()) {
    const delivery = await this.activeOrFail(courierId);
    assertCanComplete(delivery.status);
    delivery.completedAt = now;
    return toDeliveryView(await this.repo.save(delivery));
  }

  async history(courierId: string, now: Date = new Date()) {
    const done = await this.repo.find({
      where: { courierId, completedAt: Not(IsNull()) },
      order: { completedAt: 'DESC' },
    });
    const { start, end } = dayBounds(now);
    const today = done.filter((d) => d.completedAt! >= start && d.completedAt! < end);
    return {
      earningsToday: totalEarnings(today.map((d) => d.order.fee)),
      deliveriesToday: today.length,
      deliveries: done.map(toDeliveryView),
    };
  }
}
