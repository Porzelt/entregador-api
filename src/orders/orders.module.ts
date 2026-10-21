import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from '../auth/token.module';
import { CouriersModule } from '../couriers/couriers.module';
import { DeliveryEntity } from '../deliveries/delivery.entity';
import { DeclinedOrderEntity } from './declined-order.entity';
import { OrderEntity } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, DeclinedOrderEntity, DeliveryEntity]),
    TokenModule,
    CouriersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
