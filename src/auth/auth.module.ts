import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenModule } from './token.module';

@Module({
  imports: [TokenModule, CouriersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
