import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Id do entregador autenticado, preenchido pelo JwtAuthGuard. */
export const CourierId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().courierId;
});
