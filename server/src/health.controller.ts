import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      success: true,
      status: 'OK',
      message: 'Billaro API server is running smoothly',
      timestamp: new Date().toISOString(),
    };
  }
}
