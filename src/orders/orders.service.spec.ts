import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

function setup(
  overrides: {
    online?: boolean;
    orderExists?: boolean;
    declined?: boolean;
    taken?: boolean;
    active?: boolean;
  } = {},
) {
  const o = {
    online: true,
    orderExists: true,
    declined: false,
    taken: false,
    active: false,
    ...overrides,
  };
  const orders = { existsBy: jest.fn(async () => o.orderExists) };
  const declined = { existsBy: jest.fn(async () => o.declined), insert: jest.fn() };
  const deliveries = {
    existsBy: jest.fn(async () => o.taken),
    findOne: jest.fn(async () => (o.active ? { id: 'ativa' } : null)),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ ...v, id: 'd1' })),
    findOneOrFail: jest.fn(async () => ({
      id: 'd1',
      status: 'a_caminho_coleta',
      completedAt: null,
      order: { id: 'ped-1', restaurant: 'R', address: 'A', fee: 5, distanceKm: 1 },
    })),
  };
  const couriers = { getOrFail: jest.fn(async () => ({ id: 'c1', online: o.online })) };
  const service = new OrdersService(
    orders as any,
    declined as any,
    deliveries as any,
    couriers as any,
  );
  return { service, declined, deliveries };
}

describe('OrdersService', () => {
  it('aceita um pedido disponível e inicia a entrega', async () => {
    const { service, deliveries } = setup();
    const result = await service.accept('c1', 'ped-1');
    expect(result.status).toBe('a_caminho_coleta');
    expect(deliveries.save).toHaveBeenCalled();
  });

  it('não aceita com entrega ativa', async () => {
    const { service, deliveries } = setup({ active: true });
    await expect(service.accept('c1', 'ped-1')).rejects.toThrow(/entrega em andamento/);
    expect(deliveries.save).not.toHaveBeenCalled();
  });

  it('não aceita nem recusa offline', async () => {
    const { service } = setup({ online: false });
    await expect(service.accept('c1', 'ped-1')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.decline('c1', 'ped-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('404 para pedido inexistente', async () => {
    const { service } = setup({ orderExists: false });
    await expect(service.accept('c1', 'x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('não aceita pedido já recusado nem pedido levado por outro', async () => {
    await expect(setup({ declined: true }).service.accept('c1', 'ped-1')).rejects.toThrow(
      /recusou/,
    );
    await expect(setup({ taken: true }).service.accept('c1', 'ped-1')).rejects.toThrow(
      /não está mais disponível/,
    );
  });

  it('recusar registra a recusa', async () => {
    const { service, declined } = setup();
    await service.decline('c1', 'ped-1');
    expect(declined.insert).toHaveBeenCalledWith({ courierId: 'c1', orderId: 'ped-1' });
  });
});
