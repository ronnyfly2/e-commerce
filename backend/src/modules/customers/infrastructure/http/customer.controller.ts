import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { CustomerRepository } from '../persistence/customer.repository.impl';
import { CreateCustomerDto } from '../../application/dtos/create-customer.dto';
import { UpdateCustomerDto } from '../../application/dtos/update-customer.dto';
import { CustomerNotFoundError, CustomerPhoneConflictError } from '../../domain/errors/customer.errors';
import { CustomerSource } from '../../domain/customer-source.enum';

@ApiBearerAuth()
@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerRepo: CustomerRepository) {}

  @Post()
  @Permissions(Permission.CUSTOMER_CREATE)
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const existing = await this.customerRepo.findByPhone(dto.phone, user.companyId);
    if (existing) throw new CustomerPhoneConflictError(dto.phone);
    return this.customerRepo.create({ ...dto, companyId: user.companyId, source: CustomerSource.MANUAL });
  }

  @Get()
  @Permissions(Permission.CUSTOMER_VIEW)
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.customerRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.CUSTOMER_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const customer = await this.customerRepo.findById(id, user.companyId);
    if (!customer) throw new CustomerNotFoundError(id);
    return customer;
  }

  @Patch(':id')
  @Permissions(Permission.CUSTOMER_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const customer = await this.customerRepo.findById(id, user.companyId);
    if (!customer) throw new CustomerNotFoundError(id);

    if (dto.phone && dto.phone !== customer.phone) {
      const conflict = await this.customerRepo.findByPhone(dto.phone, user.companyId);
      if (conflict) throw new CustomerPhoneConflictError(dto.phone);
    }

    await this.customerRepo.update(id, dto);
    return this.customerRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.CUSTOMER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const customer = await this.customerRepo.findById(id, user.companyId);
    if (!customer) throw new CustomerNotFoundError(id);
    await this.customerRepo.softDelete(id);
  }
}
