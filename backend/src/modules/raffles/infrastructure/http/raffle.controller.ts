import {
  Body, Controller, Delete, ForbiddenException,
  Get, HttpCode, HttpStatus, Param, ParseUUIDPipe,
  Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { RaffleRepository } from '../persistence/raffle.repository.impl';
import { CreateRaffleDto } from '../../application/dtos/create-raffle.dto';
import { UpdateRaffleDto } from '../../application/dtos/update-raffle.dto';
import { UpdateRaffleStatusDto } from '../../application/dtos/update-raffle-status.dto';
import { UpdatePrizeStatusDto } from '../../application/dtos/update-prize-status.dto';
import { RaffleFiltersDto } from '../../application/dtos/raffle-filters.dto';
import { RaffleStatus, isValidRaffleTransition } from '../../domain/enums/raffle-status.enum';
import {
  RaffleInvalidTransitionError, RaffleNotEditableError, RaffleNotFoundError, RaffleNotDrawnError,
  RaffleInvalidDateRangeError,
} from '../../domain/errors/raffle.errors';

@ApiBearerAuth()
@ApiTags('Raffles')
@Controller('raffles')
export class RaffleController {
  constructor(private readonly raffleRepo: RaffleRepository) {}

  @Post()
  @ApiOperation({ summary: 'Create a new raffle (draft)' })
  @Permissions(Permission.RAFFLE_MANAGE)
  create(@Body() dto: CreateRaffleDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    if (new Date(dto.endsAt) <= new Date(dto.startsAt)) throw new RaffleInvalidDateRangeError();
    return this.raffleRepo.create(dto, user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'List raffles' })
  @Permissions(Permission.RAFFLE_VIEW)
  findAll(@Query() filters: RaffleFiltersDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.raffleRepo.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single raffle' })
  @Permissions(Permission.RAFFLE_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    return raffle;
  }

  @Get(':id/eligible')
  @ApiOperation({ summary: 'Preview customers currently eligible for this raffle (not persisted)' })
  @Permissions(Permission.RAFFLE_VIEW)
  async eligible(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    const customers = await this.raffleRepo.findEligibleCustomers(user.companyId, raffle.costPoints);
    return { count: customers.length, customers };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a raffle while it is still DRAFT' })
  @Permissions(Permission.RAFFLE_MANAGE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRaffleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    if (raffle.status !== RaffleStatus.DRAFT) throw new RaffleNotEditableError();

    const effectiveStartsAt = dto.startsAt ?? raffle.startsAt.toISOString();
    const effectiveEndsAt = dto.endsAt ?? raffle.endsAt.toISOString();
    if (new Date(effectiveEndsAt) <= new Date(effectiveStartsAt)) throw new RaffleInvalidDateRangeError();

    await this.raffleRepo.update(id, dto);
    return this.raffleRepo.findById(id, user.companyId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition a raffle to a new status (open it, or cancel it without drawing)' })
  @Permissions(Permission.RAFFLE_MANAGE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRaffleStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    if (!isValidRaffleTransition(raffle.status, dto.status)) {
      throw new RaffleInvalidTransitionError(raffle.status, dto.status);
    }
    await this.raffleRepo.updateStatus(id, dto.status);
    return this.raffleRepo.findById(id, user.companyId);
  }

  @Post(':id/draw')
  @ApiOperation({ summary: 'Draw a winner among the currently eligible customers and close the raffle' })
  @Permissions(Permission.RAFFLE_MANAGE)
  async draw(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    return this.raffleRepo.draw(raffle);
  }

  @Patch(':id/prize')
  @ApiOperation({ summary: 'Track prize delivery status for a drawn raffle, optionally with a proof-of-delivery image' })
  @Permissions(Permission.RAFFLE_MANAGE)
  async updatePrizeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrizeStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    if (raffle.status !== RaffleStatus.CLOSED) throw new RaffleNotDrawnError();

    await this.raffleRepo.updatePrizeStatus(id, dto.status, dto.imageUrl ?? null);
    return this.raffleRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a raffle that is still DRAFT' })
  @Permissions(Permission.RAFFLE_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const raffle = await this.raffleRepo.findById(id, user.companyId);
    if (!raffle) throw new RaffleNotFoundError(id);
    if (raffle.status !== RaffleStatus.DRAFT) throw new RaffleNotEditableError();
    await this.raffleRepo.softDelete(id);
  }
}
