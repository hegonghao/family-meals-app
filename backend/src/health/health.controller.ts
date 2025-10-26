import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve overall service health' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully.' })
  async check() {
    let databaseStatus: { status: 'up' | 'down'; message?: string } = { status: 'up' };

    try {
      await this.dataSource.query('SELECT 1');
    } catch (error) {
      databaseStatus = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }

    return {
      status: databaseStatus.status === 'up' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '1.0.0',
      database: databaseStatus,
    };
  }
}
