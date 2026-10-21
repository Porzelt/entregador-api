import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CouriersService } from '../couriers/couriers.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly couriers: CouriersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const courier = await this.couriers.findByEmail(email);
    // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
    if (!courier || !(await bcrypt.compare(password, courier.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    const accessToken = await this.jwt.signAsync({ sub: courier.id });
    return {
      accessToken,
      courier: { id: courier.id, name: courier.name, online: courier.online },
    };
  }
}
