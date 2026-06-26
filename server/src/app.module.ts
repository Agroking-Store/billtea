import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Serve uploaded files statically at /uploads/...
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Core modules
    PrismaModule,
    AuthModule,
    CompanyModule,
    BranchesModule,
    UsersModule,
    ProfileModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
