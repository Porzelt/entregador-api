/** Violação de regra de negócio. Um filtro global converte em HTTP 409. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
