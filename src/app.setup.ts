import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainErrorFilter } from './common/domain-error.filter';

/** Configuração comum à aplicação real e aos testes e2e. */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new DomainErrorFilter());
}
