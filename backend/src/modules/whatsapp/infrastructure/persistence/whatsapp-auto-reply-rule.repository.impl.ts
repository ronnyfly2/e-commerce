import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppAutoReplyRuleOrmEntity } from './whatsapp-auto-reply-rule.orm-entity';

export abstract class WhatsAppAutoReplyRuleRepository {
  abstract create(data: Partial<WhatsAppAutoReplyRuleOrmEntity>): Promise<WhatsAppAutoReplyRuleOrmEntity>;
  abstract findById(id: string, companyId: string): Promise<WhatsAppAutoReplyRuleOrmEntity | null>;
  abstract findByCompany(companyId: string): Promise<WhatsAppAutoReplyRuleOrmEntity[]>;
  abstract findActiveByCompany(companyId: string): Promise<WhatsAppAutoReplyRuleOrmEntity[]>;
  abstract update(id: string, data: Partial<WhatsAppAutoReplyRuleOrmEntity>): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}

@Injectable()
export class WhatsAppAutoReplyRuleRepositoryImpl implements WhatsAppAutoReplyRuleRepository {
  constructor(
    @InjectRepository(WhatsAppAutoReplyRuleOrmEntity)
    private readonly repo: Repository<WhatsAppAutoReplyRuleOrmEntity>,
  ) {}

  create(data: Partial<WhatsAppAutoReplyRuleOrmEntity>): Promise<WhatsAppAutoReplyRuleOrmEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string, companyId: string): Promise<WhatsAppAutoReplyRuleOrmEntity | null> {
    return this.repo.findOne({ where: { id, companyId } });
  }

  findByCompany(companyId: string): Promise<WhatsAppAutoReplyRuleOrmEntity[]> {
    return this.repo.find({ where: { companyId }, order: { sortOrder: 'ASC' } });
  }

  findActiveByCompany(companyId: string): Promise<WhatsAppAutoReplyRuleOrmEntity[]> {
    return this.repo.find({ where: { companyId, isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async update(id: string, data: Partial<WhatsAppAutoReplyRuleOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
