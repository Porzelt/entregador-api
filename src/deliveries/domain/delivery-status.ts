import { DomainError } from '../../common/domain-error';

export const STATUS_FLOW = [
  'a_caminho_coleta',
  'coletado',
  'a_caminho_entrega',
  'entregue',
] as const;

export type DeliveryStatus = (typeof STATUS_FLOW)[number];

export const STATUS_LABEL: Record<DeliveryStatus, string> = {
  a_caminho_coleta: 'A caminho da coleta',
  coletado: 'Pedido coletado',
  a_caminho_entrega: 'A caminho da entrega',
  entregue: 'Entregue',
};

export function nextStatus(status: DeliveryStatus): DeliveryStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}

/** Devolve o próximo status ou lança DomainError se a entrega já está em 'entregue'. */
export function advanceStatus(status: DeliveryStatus): DeliveryStatus {
  const next = nextStatus(status);
  if (!next) throw new DomainError('A entrega já está no último status; conclua a entrega.');
  return next;
}

/** Só uma entrega 'entregue' pode ser concluída. */
export function assertCanComplete(status: DeliveryStatus): void {
  if (status !== 'entregue') {
    throw new DomainError(
      `Só é possível concluir uma entrega com status "entregue" (status atual: "${status}").`,
    );
  }
}

/** Soma em centavos para evitar erro de ponto flutuante. */
export function totalEarnings(fees: number[]): number {
  return fees.reduce((sum, fee) => sum + Math.round(fee * 100), 0) / 100;
}

/** Início (00:00) e fim (exclusivo) do dia de `now`, no fuso do processo. */
export function dayBounds(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}
