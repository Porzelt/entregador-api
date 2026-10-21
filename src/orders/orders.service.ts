import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { CouriersService } from '../couriers/couriers.service';
import { DeliveryEntity } from '../deliveries/delivery.entity';
import { toDeliveryView } from '../deliveries/delivery.view';
import { DeclinedOrderEntity } from './declined-order.entity';
import { OrderEntity } from './order.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(DeclinedOrderEntity)
    private readonly declined: Repository<DeclinedOrderEntity>,
    @InjectRepository(DeliveryEntity) private readonly deliveries: Repository<DeliveryEntity>,
    private readonly couriers: CouriersService,
  ) {}

  /** Pedidos livres (sem entrega) que este entregador ainda não recusou. Offline: lista vazia. */
  async listAvailable(courierId: string): Promise<OrderEntity[]> {
    const courier = await this.couriers.getOrFail(courierId);
    if (!courier.online) return [];
    return this.orders
      .createQueryBuilder('o')
      .where('NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.order_id = o.id)')
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM declined_orders x WHERE x.order_id = o.id AND x.courier_id = :courierId)',
        { courierId },
      )
      .orderBy('o.id', 'ASC')
      .getMany();
  }

  async accept(courierId: string, orderId: string) {
    await this.assertOnlineAndAvailable(courierId, orderId);

    const active = await this.deliveries.findOne({ where: { courierId, completedAt: IsNull() } });
    if (active) {
      throw new ConflictException(
        'Você já tem uma entrega em andamento. Conclua-a antes de aceitar outra.',
      );
    }

    try {
      const saved = await this.deliveries.save(
        this.deliveries.create({
          courierId,
          orderId,
          status: 'a_caminho_coleta',
          completedAt: null,
        }),
      );
      return toDeliveryView(await this.deliveries.findOneOrFail({ where: { id: saved.id } }));
    } catch (error) {
      // Corrida: outro pedido aceito ao mesmo tempo (índice parcial) ou pedido já levado por outro.
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'Não foi possível aceitar: o pedido não está mais disponível ou você já tem uma entrega ativa.',
        );
      }
      throw error;
    }
  }

  async decline(courierId: string, orderId: string) {
    await this.assertOnlineAndAvailable(courierId, orderId);
    await this.declined.insert({ courierId, orderId });
    return { orderId, declined: true };
  }

  private async assertOnlineAndAvailable(courierId: string, orderId: string): Promise<void> {
    const courier = await this.couriers.getOrFail(courierId);
    if (!courier.online)
      throw new ConflictException('Fique online para aceitar ou recusar pedidos.');

    if (!(await this.orders.existsBy({ id: orderId }))) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (await this.declined.existsBy({ courierId, orderId })) {
      throw new ConflictException('Você já recusou este pedido.');
    }
    if (await this.deliveries.existsBy({ orderId })) {
      throw new ConflictException('Este pedido não está mais disponível.');
    }
  }
}
