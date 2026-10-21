import { NotFoundException } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { DeliveriesService } from './deliveries.service';
import { DeliveryEntity } from './delivery.entity';

const order = { id: 'ped-1', restaurant: 'R', address: 'A', fee: 10.1, distanceKm: 2 };

function delivery(status: DeliveryEntity['status'], completedAt: Date | null = null) {
  return {
    id: 'd1',
    courierId: 'c1',
    orderId: order.id,
    order,
    status,
    completedAt,
  } as DeliveryEntity;
}

function setup() {
  const repo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(async (d) => d) };
  return { repo, service: new DeliveriesService(repo as any) };
}

describe('DeliveriesService', () => {
  it('current: 404 sem entrega ativa', async () => {
    const { repo, service } = setup();
    repo.findOne.mockResolvedValue(null);
    await expect(service.current('c1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('advance: move para o próximo status', async () => {
    const { repo, service } = setup();
    repo.findOne.mockResolvedValue(delivery('coletado'));
    const result = await service.advance('c1');
    expect(result.status).toBe('a_caminho_entrega');
    expect(result.statusLabel).toBe('A caminho da entrega');
  });

  it('advance: erro de domínio quando já entregue', async () => {
    const { repo, service } = setup();
    repo.findOne.mockResolvedValue(delivery('entregue'));
    await expect(service.advance('c1')).rejects.toBeInstanceOf(DomainError);
  });

  it('complete: recusa antes de entregue e não grava', async () => {
    const { repo, service } = setup();
    repo.findOne.mockResolvedValue(delivery('a_caminho_entrega'));
    await expect(service.complete('c1')).rejects.toBeInstanceOf(DomainError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('complete: grava a data de conclusão quando entregue', async () => {
    const { repo, service } = setup();
    const now = new Date(2026, 5, 10, 12);
    repo.findOne.mockResolvedValue(delivery('entregue'));
    const result = await service.complete('c1', now);
    expect(result.completedAt).toEqual(now);
  });

  it('history: soma só os ganhos de hoje', async () => {
    const { repo, service } = setup();
    const now = new Date(2026, 5, 10, 18);
    repo.find.mockResolvedValue([
      delivery('entregue', new Date(2026, 5, 10, 9)),
      delivery('entregue', new Date(2026, 5, 10, 8)),
      delivery('entregue', new Date(2026, 5, 9, 20)),
    ]);
    const result = await service.history('c1', now);
    expect(result.deliveries).toHaveLength(3);
    expect(result.deliveriesToday).toBe(2);
    expect(result.earningsToday).toBe(20.2);
  });
});
