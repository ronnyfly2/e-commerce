import {
  Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { PointsRepository } from '../persistence/points.repository.impl';
import { AdjustPointsDto } from '../../application/dtos/adjust-points.dto';

@ApiBearerAuth()
@ApiTags('Points')
@Controller('customers/:customerId/points')
export class PointsController {
  constructor(private readonly pointsRepo: PointsRepository) {}

  @Get()
  @ApiOperation({ summary: 'Get a customer points balance and transaction history' })
  @Permissions(Permission.POINTS_VIEW)
  async findForCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const [balance, transactions] = await Promise.all([
      this.pointsRepo.getBalance(customerId, user.companyId),
      this.pointsRepo.listTransactions(customerId, user.companyId, query),
    ]);
    return { balance, transactions };
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manually grant or deduct points for a customer' })
  @Permissions(Permission.POINTS_MANAGE)
  async adjust(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: AdjustPointsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    await this.pointsRepo.grantManual(customerId, user.companyId, dto.points, dto.reason, user.sub);
    return { balance: await this.pointsRepo.getBalance(customerId, user.companyId) };
  }
}
