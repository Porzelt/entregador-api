import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetOnlineDto {
  @ApiProperty({ example: true })
  @IsBoolean({ message: 'O campo "online" deve ser verdadeiro ou falso.' })
  online: boolean;
}
