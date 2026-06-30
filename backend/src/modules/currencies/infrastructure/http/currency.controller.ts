import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrencyRepository } from '../persistence/currency.repository.impl';
import { CreateCurrencyDto } from '../../application/dtos/create-currency.dto';
import { UpdateCurrencyDto } from '../../application/dtos/update-currency.dto';
import {
  CurrencyCodeConflictError,
  CurrencyNotFoundError,
  DefaultCurrencyCannotBeDeactivatedError,
} from '../../domain/errors/currency.errors';

@ApiBearerAuth()
@ApiTags('Currencies')
@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyRepo: CurrencyRepository) {}

  @Get()
  @Permissions(Permission.CURRENCY_VIEW)
  @ApiOperation({ summary: 'List all currencies ordered by default first' })
  findAll() {
    return this.currencyRepo.findAll();
  }

  @Get(':id')
  @Permissions(Permission.CURRENCY_VIEW)
  @ApiOperation({ summary: 'Get currency by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const currency = await this.currencyRepo.findById(id);
    if (!currency) throw new CurrencyNotFoundError(id);
    return currency;
  }

  @Post()
  @Permissions(Permission.CURRENCY_CREATE)
  @ApiOperation({ summary: 'Create a new currency (super-admin)' })
  async create(@Body() dto: CreateCurrencyDto) {
    const existing = await this.currencyRepo.findByCode(dto.code);
    if (existing) throw new CurrencyCodeConflictError(dto.code);

    if (dto.isDefault) {
      await this.currencyRepo.clearDefault();
    }

    return this.currencyRepo.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.CURRENCY_UPDATE)
  @ApiOperation({ summary: 'Update currency rate, name, symbol or status' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCurrencyDto,
  ) {
    const currency = await this.currencyRepo.findById(id);
    if (!currency) throw new CurrencyNotFoundError(id);

    if (dto.isActive === false && currency.isDefault) {
      throw new DefaultCurrencyCannotBeDeactivatedError();
    }

    await this.currencyRepo.update(id, dto);
    return this.currencyRepo.findById(id);
  }

  @Patch(':id/default')
  @Permissions(Permission.CURRENCY_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set currency as the system default' })
  async setDefault(@Param('id', ParseUUIDPipe) id: string) {
    const currency = await this.currencyRepo.findById(id);
    if (!currency) throw new CurrencyNotFoundError(id);

    await this.currencyRepo.clearDefault();
    await this.currencyRepo.update(id, { isDefault: true, isActive: true });
    return this.currencyRepo.findById(id);
  }
}
