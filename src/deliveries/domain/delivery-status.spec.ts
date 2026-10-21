import { DomainError } from '../../common/domain-error';
import {
  advanceStatus,
  assertCanComplete,
  dayBounds,
  nextStatus,
  STATUS_FLOW,
  totalEarnings,
} from './delivery-status';

describe('regra de status', () => {
  it('segue a ordem coleta -> coletado -> entrega -> entregue', () => {
    expect(STATUS_FLOW).toEqual(['a_caminho_coleta', 'coletado', 'a_caminho_entrega', 'entregue']);
    expect(advanceStatus('a_caminho_coleta')).toBe('coletado');
    expect(advanceStatus('coletado')).toBe('a_caminho_entrega');
    expect(advanceStatus('a_caminho_entrega')).toBe('entregue');
  });

  it('não avança além de entregue', () => {
    expect(nextStatus('entregue')).toBeNull();
    expect(() => advanceStatus('entregue')).toThrow(DomainError);
  });

  it('só permite concluir quando entregue', () => {
    expect(() => assertCanComplete('entregue')).not.toThrow();
    expect(() => assertCanComplete('coletado')).toThrow(DomainError);
    expect(() => assertCanComplete('a_caminho_coleta')).toThrow(/entregue/);
  });
});

describe('ganhos', () => {
  it('soma sem erro de ponto flutuante', () => {
    expect(totalEarnings([0.1, 0.2])).toBe(0.3);
    expect(totalEarnings([8.5, 12, 15.75])).toBe(36.25);
    expect(totalEarnings([])).toBe(0);
  });

  it('calcula os limites do dia', () => {
    const { start, end } = dayBounds(new Date(2026, 0, 31, 15, 30));
    expect(start).toEqual(new Date(2026, 0, 31, 0, 0));
    expect(end).toEqual(new Date(2026, 1, 1, 0, 0));
  });
});
