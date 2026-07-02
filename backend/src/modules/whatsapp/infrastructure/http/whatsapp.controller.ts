import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { CustomerRepository } from '@/modules/customers/infrastructure/persistence/customer.repository.impl';
import { CustomerNotFoundError } from '@/modules/customers/domain/errors/customer.errors';
import { WhatsAppMessageRepository } from '../persistence/whatsapp-message.repository.impl';
import { WhatsAppAutoReplyRuleRepository } from '../persistence/whatsapp-auto-reply-rule.repository.impl';
import { WhatsAppGraphClient } from '../services/whatsapp-graph-client.service';
import { WhatsAppDirection } from '../../domain/whatsapp-direction.enum';
import { SendWhatsAppMessageDto } from '../../application/dtos/send-whatsapp-message.dto';
import { CreateAutoReplyRuleDto } from '../../application/dtos/create-auto-reply-rule.dto';
import { UpdateAutoReplyRuleDto } from '../../application/dtos/update-auto-reply-rule.dto';
import { AutoReplyRuleNotFoundError } from '../../domain/errors/whatsapp.errors';

@ApiBearerAuth()
@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly messageRepo: WhatsAppMessageRepository,
    private readonly ruleRepo: WhatsAppAutoReplyRuleRepository,
    private readonly graphClient: WhatsAppGraphClient,
  ) {}

  @Get('customers/:customerId/messages')
  @Permissions(Permission.CUSTOMER_VIEW)
  async findMessages(@Param('customerId', ParseUUIDPipe) customerId: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const customer = await this.customerRepo.findById(customerId, user.companyId);
    if (!customer) throw new CustomerNotFoundError(customerId);
    return this.messageRepo.findByCustomer(customerId, user.companyId);
  }

  @Post('customers/:customerId/messages')
  @Permissions(Permission.CUSTOMER_UPDATE)
  async sendMessage(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: SendWhatsAppMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const customer = await this.customerRepo.findById(customerId, user.companyId);
    if (!customer) throw new CustomerNotFoundError(customerId);

    const sent = await this.graphClient.sendTextMessage(customer.phone, dto.body);
    return this.messageRepo.create({
      companyId: user.companyId,
      customerId,
      direction: WhatsAppDirection.OUT,
      body: dto.body,
      waMessageId: sent?.id ?? null,
      status: 'sent',
    });
  }

  @Get('rules')
  @Permissions(Permission.CUSTOMER_VIEW)
  findRules(@CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.ruleRepo.findByCompany(user.companyId);
  }

  @Post('rules')
  @Permissions(Permission.CUSTOMER_UPDATE)
  createRule(@Body() dto: CreateAutoReplyRuleDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.ruleRepo.create({ ...dto, companyId: user.companyId });
  }

  @Patch('rules/:id')
  @Permissions(Permission.CUSTOMER_UPDATE)
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAutoReplyRuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const rule = await this.ruleRepo.findById(id, user.companyId);
    if (!rule) throw new AutoReplyRuleNotFoundError(id);
    await this.ruleRepo.update(id, dto);
    return this.ruleRepo.findById(id, user.companyId);
  }

  @Delete('rules/:id')
  @Permissions(Permission.CUSTOMER_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRule(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const rule = await this.ruleRepo.findById(id, user.companyId);
    if (!rule) throw new AutoReplyRuleNotFoundError(id);
    await this.ruleRepo.softDelete(id);
  }
}
