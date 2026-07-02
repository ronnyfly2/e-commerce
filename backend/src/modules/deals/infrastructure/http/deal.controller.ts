import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  HttpStatus, Param, ParseUUIDPipe, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { DealRepository } from '../persistence/deal.repository.impl';
import { CreateDealDto } from '../../application/dtos/create-deal.dto';
import { UpdateDealDto } from '../../application/dtos/update-deal.dto';
import { UpdateDealStageDto } from '../../application/dtos/update-deal-stage.dto';
import { DealNotFoundError } from '../../domain/errors/deal.errors';
import { DealStage } from '../../domain/deal-stage.enum';

@ApiBearerAuth()
@ApiTags('Deals')
@Controller('deals')
export class DealController {
  constructor(private readonly dealRepo: DealRepository) {}

  @Post()
  @Permissions(Permission.DEAL_CREATE)
  create(@Body() dto: CreateDealDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.dealRepo.create({ ...dto, companyId: user.companyId, stage: dto.stage ?? DealStage.NEW });
  }

  @Get()
  @Permissions(Permission.DEAL_VIEW)
  findAll(@CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.dealRepo.findAll(user.companyId);
  }

  @Get(':id')
  @Permissions(Permission.DEAL_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const deal = await this.dealRepo.findById(id, user.companyId);
    if (!deal) throw new DealNotFoundError(id);
    return deal;
  }

  @Patch(':id')
  @Permissions(Permission.DEAL_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const deal = await this.dealRepo.findById(id, user.companyId);
    if (!deal) throw new DealNotFoundError(id);
    await this.dealRepo.update(id, dto);
    return this.dealRepo.findById(id, user.companyId);
  }

  @Patch(':id/stage')
  @Permissions(Permission.DEAL_UPDATE)
  async updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const deal = await this.dealRepo.findById(id, user.companyId);
    if (!deal) throw new DealNotFoundError(id);
    await this.dealRepo.update(id, { stage: dto.stage });
    return this.dealRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.DEAL_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const deal = await this.dealRepo.findById(id, user.companyId);
    if (!deal) throw new DealNotFoundError(id);
    await this.dealRepo.softDelete(id);
  }
}
