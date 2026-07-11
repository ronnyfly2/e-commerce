import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAdminGuard } from '@/shared/infrastructure/guards/super-admin.guard';
import { NonProductionGuard } from '@/shared/infrastructure/guards/non-production.guard';
import { DevToolsService } from '../dev-tools.service';
import { WipeDatabaseDto } from '../../application/dtos/wipe-database.dto';

@ApiBearerAuth()
@ApiTags('Dev Tools')
@UseGuards(SuperAdminGuard, NonProductionGuard)
@Controller('dev-tools/seeds')
export class DevToolsController {
  constructor(private readonly devTools: DevToolsService) {}

  @Get()
  @ApiOperation({ summary: 'List every seed and whether it has been applied' })
  list() {
    return this.devTools.list();
  }

  @Post('run')
  @ApiOperation({ summary: 'Run every seed, in dependency order' })
  async runAll() {
    await this.devTools.runAll();
    return this.devTools.list();
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Run a single seed by id' })
  async runOne(@Param('id') id: string) {
    await this.devTools.runOne(id);
    return this.devTools.list();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete the data created by a single seed' })
  async deleteOne(@Param('id') id: string) {
    await this.devTools.deleteSeedData(id);
    return this.devTools.list();
  }

  @Delete('database/all')
  @ApiOperation({ summary: 'Truncate every business table — requires a typed confirmation phrase' })
  @HttpCode(HttpStatus.OK)
  wipeDatabase(@Body() dto: WipeDatabaseDto) {
    return this.devTools.wipeDatabase(dto.confirm);
  }
}
