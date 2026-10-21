import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CourierId } from '../auth/courier-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CouriersService } from './couriers.service';
import { SetOnlineDto } from './dto/set-online.dto';

@ApiTags('Entregador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courier')
export class CouriersController {
  constructor(private readonly couriers: CouriersService) {}

  @Put('online')
  @ApiOperation({ summary: 'Fica online ou offline' })
  setOnline(@CourierId() courierId: string, @Body() dto: SetOnlineDto) {
    return this.couriers.setOnline(courierId, dto.online);
  }
}
