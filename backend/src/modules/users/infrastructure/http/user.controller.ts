import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import * as bcrypt from 'bcryptjs';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { Permission } from '@/shared/domain/permission.enum';
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { StaffUserRepository } from '../persistence/user.repository.impl';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { UserEmailConflictError, UserNotFoundError } from '../../domain/errors/user.errors';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userRepo: StaffUserRepository) {}

  @Post()
  @Permissions(Permission.USER_CREATE)
  @ApiOperation({ summary: 'Create staff user in current company' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');

    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new UserEmailConflictError(dto.email);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.userRepo.create({
      ...dto,
      passwordHash,
      companyId: user.companyId,
    });
  }

  @Get()
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: 'List staff users of current company' })
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    return this.userRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.USER_VIEW)
  @ApiOperation({ summary: 'Get user by id (company-scoped)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const found = await this.userRepo.findById(id, user.companyId);
    if (!found) throw new UserNotFoundError(id);
    return found;
  }

  @Patch(':id')
  @Permissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const found = await this.userRepo.findById(id, user.companyId);
    if (!found) throw new UserNotFoundError(id);

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.password) {
      updateData['passwordHash'] = await bcrypt.hash(dto.password, 12);
      delete updateData['password'];
    }

    await this.userRepo.update(id, updateData);
    return this.userRepo.findById(id, user.companyId);
  }

  @Delete(':id')
  @Permissions(Permission.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete user' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.companyId) throw new ForbiddenException('No company context');
    const found = await this.userRepo.findById(id, user.companyId);
    if (!found) throw new UserNotFoundError(id);
    await this.userRepo.softDelete(id);
  }
}
