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
import { CurrentUser } from '@/shared/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/infrastructure/strategies/jwt.strategy';
import { PaginationQueryDto } from '@/shared/domain/pagination';
import { RoleRepository } from '../persistence/role.repository.impl';
import { CreateRoleDto } from '../../application/dtos/create-role.dto';
import { UpdateRoleDto } from '../../application/dtos/update-role.dto';
import {
  RoleNameConflictError,
  RoleNotFoundError,
  SystemRoleMutationError,
} from '../../domain/errors/role.errors';

@ApiBearerAuth()
@ApiTags('Roles')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleRepo: RoleRepository) {}

  @Post()
  @Permissions(Permission.ROLE_CREATE)
  @ApiOperation({ summary: 'Create role for current company' })
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const existing = await this.roleRepo.findByName(dto.name, user.companyId);
    if (existing) throw new RoleNameConflictError(dto.name);

    return this.roleRepo.create({ ...dto, companyId: user.companyId });
  }

  @Get()
  @Permissions(Permission.ROLE_VIEW)
  @ApiOperation({ summary: 'List roles (company + system)' })
  findAll(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtPayload) {
    return this.roleRepo.findAll(user.companyId, query);
  }

  @Get(':id')
  @Permissions(Permission.ROLE_VIEW)
  @ApiOperation({ summary: 'Get role by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const role = await this.roleRepo.findById(id);
    if (!role) throw new RoleNotFoundError(id);
    return role;
  }

  @Patch(':id')
  @Permissions(Permission.ROLE_UPDATE)
  @ApiOperation({ summary: 'Update role' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.roleRepo.findById(id);
    if (!role) throw new RoleNotFoundError(id);
    if (role.isSystem) throw new SystemRoleMutationError();

    await this.roleRepo.update(id, dto);
    return this.roleRepo.findById(id);
  }

  @Delete(':id')
  @Permissions(Permission.ROLE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete role' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const role = await this.roleRepo.findById(id);
    if (!role) throw new RoleNotFoundError(id);
    if (role.isSystem) throw new SystemRoleMutationError();
    await this.roleRepo.softDelete(id);
  }
}
