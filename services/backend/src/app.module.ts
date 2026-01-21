import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './core/health/health.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoutingTableModule } from './modules/routing-table/routing-table.module';
import { SegmentStoreModule } from './modules/segment-store/segment-store.module';
import { MessageStoreModule } from './modules/message-store/message-store.module';
import { CompanyProjectModule } from './modules/company-project/company-project.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommonModule } from './core/common/common.module';
import { ExportImportModule } from './shared/export-import/export-import.module';
import { ValidationModule } from './shared/validation/validation.module';
import { AuditInterceptor } from './core/common/interceptors/audit.interceptor';
import { DictionariesModule } from './modules/dictionaries';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    CommonModule,
    ExportImportModule,
    ValidationModule,
    HealthModule,
    AuthModule,
    CompanyProjectModule,
    RoutingTableModule,
    SegmentStoreModule,
    MessageStoreModule,
    AuditModule,
    AdminModule,
    DictionariesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
