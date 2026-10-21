import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtSecret } from '../config/configuration';

/** Configuração única do JWT, importada por quem assina (auth) ou verifica (guard) tokens. */
@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret(),
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as any },
    }),
  ],
  exports: [JwtModule],
})
export class TokenModule {}
