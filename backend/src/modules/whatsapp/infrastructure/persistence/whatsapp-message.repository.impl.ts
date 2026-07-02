import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppMessageOrmEntity } from './whatsapp-message.orm-entity';

export abstract class WhatsAppMessageRepository {
  abstract create(data: Partial<WhatsAppMessageOrmEntity>): Promise<WhatsAppMessageOrmEntity>;
  abstract findByCustomer(customerId: string, companyId: string): Promise<WhatsAppMessageOrmEntity[]>;
  abstract updateStatusByWaMessageId(waMessageId: string, status: string): Promise<void>;
}

@Injectable()
export class WhatsAppMessageRepositoryImpl implements WhatsAppMessageRepository {
  constructor(
    @InjectRepository(WhatsAppMessageOrmEntity)
    private readonly repo: Repository<WhatsAppMessageOrmEntity>,
  ) {}

  create(data: Partial<WhatsAppMessageOrmEntity>): Promise<WhatsAppMessageOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findByCustomer(customerId: string, companyId: string): Promise<WhatsAppMessageOrmEntity[]> {
    return this.repo.find({
      where: { customerId, companyId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateStatusByWaMessageId(waMessageId: string, status: string): Promise<void> {
    await this.repo.update({ waMessageId }, { status });
  }
}
