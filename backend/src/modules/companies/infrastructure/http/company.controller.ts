import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { PaginationQueryDto } from '@/shared/domain/pagination';

import { CompanyRepository } from '../persistence/company.repository.impl';
import { CreateCompanyDto } from '../../application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../../application/dtos/update-company.dto';
import {
  CompanyNotFoundError,
  CompanyRucConflictError,
  CompanySlugConflictError,
} from '../../domain/errors/company.errors';

@ApiBearerAuth()
@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyRepo: CompanyRepository) {}

  @Post()
  @Permissions(Permission.COMPANY_CREATE)
  @ApiOperation({ summary: 'Create a new company (super-admin)' })
  async create(@Body() dto: CreateCompanyDto) {
    const [existingSlug, existingRuc] = await Promise.all([
      this.companyRepo.findBySlug(dto.slug),
      this.companyRepo.findByRuc(dto.ruc),
    ]);

    if (existingSlug) throw new CompanySlugConflictError(dto.slug);
    if (existingRuc) throw new CompanyRucConflictError(dto.ruc);

    return this.companyRepo.create(dto);
  }

  @Get()
  @Permissions(Permission.COMPANY_VIEW)
  @ApiOperation({ summary: 'List companies with pagination' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.companyRepo.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.COMPANY_VIEW)
  @ApiOperation({ summary: 'Get company by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const company = await this.companyRepo.findById(id);
    if (!company) throw new CompanyNotFoundError(id);
    return company;
  }

  @Patch(':id')
  @Permissions(Permission.COMPANY_UPDATE)
  @ApiOperation({ summary: 'Update company' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.companyRepo.findById(id);
    if (!company) throw new CompanyNotFoundError(id);

    if (dto.slug && dto.slug !== company.slug) {
      const existing = await this.companyRepo.findBySlug(dto.slug);
      if (existing) throw new CompanySlugConflictError(dto.slug);
    }

    if (dto.ruc && dto.ruc !== company.ruc) {
      const existing = await this.companyRepo.findByRuc(dto.ruc);
      if (existing) throw new CompanyRucConflictError(dto.ruc);
    }

    await this.companyRepo.update(id, dto);
    return this.companyRepo.findById(id);
  }

  @Delete(':id')
  @Permissions(Permission.COMPANY_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete company' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const company = await this.companyRepo.findById(id);
    if (!company) throw new CompanyNotFoundError(id);
    await this.companyRepo.softDelete(id);
  }
}
