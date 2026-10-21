import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourierEntity } from './courier.entity';

@Injectable()
export class CouriersService {
  constructor(@InjectRepository(CourierEntity) private readonly repo: Repository<CourierEntity>) {}

  findByEmail(email: string): Promise<CourierEntity | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  async getOrFail(id: string): Promise<CourierEntity> {
    const courier = await this.repo.findOne({ where: { id } });
    if (!courier) throw new NotFoundException('Entregador não encontrado.');
    return courier;
  }

  async setOnline(id: string, online: boolean): Promise<{ online: boolean }> {
    const courier = await this.getOrFail(id);
    courier.online = online;
    await this.repo.save(courier);
    return { online: courier.online };
  }
}
