import { Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CourierId } from '../auth/courier-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';

@ApiTags('Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('available')
  @ApiOperation({ summary: 'Pedidos disponíveis (vazio se offline; sem aceitos/recusados)' })
  available(@CourierId() courierId: string) {
    return this.orders.listAvailable(courierId);
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aceita o pedido e inicia a entrega (uma por vez)' })
  accept(@CourierId() courierId: string, @Param('id') id: string) {
    return this.orders.accept(courierId, id);
  }

  @Post(':id/decline')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recusa o pedido; ele não volta a aparecer para você' })
  decline(@CourierId() courierId: string, @Param('id') id: string) {
    return this.orders.decline(courierId, id);
  }
}
