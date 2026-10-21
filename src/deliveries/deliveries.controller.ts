import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CourierId } from '../auth/courier-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeliveriesService } from './deliveries.service';

@ApiTags('Entregas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get('current')
  @ApiOperation({ summary: 'Entrega em andamento (404 se não houver)' })
  current(@CourierId() courierId: string) {
    return this.deliveries.current(courierId);
  }

  @Post('current/advance')
  @HttpCode(200)
  @ApiOperation({ summary: 'Avança o status: coleta → coletado → entrega → entregue' })
  advance(@CourierId() courierId: string) {
    return this.deliveries.advance(courierId);
  }

  @Post('current/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Conclui a entrega (somente com status "entregue")' })
  complete(@CourierId() courierId: string) {
    return this.deliveries.complete(courierId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Entregas concluídas e total de ganhos do dia' })
  history(@CourierId() courierId: string) {
    return this.deliveries.history(courierId);
  }
}
