import { DeliveryEntity } from './delivery.entity';
import { STATUS_LABEL } from './domain/delivery-status';

/** Formato de resposta da API, igual ao contrato do app (Delivery/Order). */
export function toDeliveryView(d: DeliveryEntity) {
  return {
    id: d.id,
    status: d.status,
    statusLabel: STATUS_LABEL[d.status],
    completedAt: d.completedAt,
    order: {
      id: d.order.id,
      restaurant: d.order.restaurant,
      address: d.order.address,
      fee: d.order.fee,
      distanceKm: d.order.distanceKm,
    },
  };
}
