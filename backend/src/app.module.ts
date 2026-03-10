import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { APP_INTERCEPTOR, APP_GUARD, Reflector } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { AuditService } from './audit/audit.service';
import { AuditInterceptor } from './audit/audit.interceptor';
import { UpdateLastSeenInterceptor } from './common/interceptors/update-lastseen.interceptor';
import { CompanyModule } from './company/company.module';
import { KeycloakAdminModule } from './keycloak-admin/keycloak-admin.module';
import { ProjectsModule } from './projects/projects.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DiligencesModule } from './diligences/diligences.module';
import { HealthModule } from './health/health.module';
import { RolesGuard } from './auth/roles.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.dev',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = (process.env.NODE_ENV || config.get('NODE_ENV') || '').toLowerCase()
        const isProd = nodeEnv === 'production' || nodeEnv === 'prod'

        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL') || undefined,
          host: config.get('DB_HOST') || process.env.RDS_HOSTNAME,
          port: Number(config.get('DB_PORT') || process.env.RDS_PORT || 5432),
          username: config.get('DB_USER') || process.env.RDS_USERNAME,
          password: config.get('DB_PASSWORD') || process.env.RDS_PASSWORD,
          database: config.get('DB_NAME') || process.env.RDS_DB_NAME,

          // Only enable SSL in production (or when explicitly configured)
          ssl: isProd ? { rejectUnauthorized: false } : false,

          synchronize: true,
          autoLoadEntities: true,
        }
      },
    }),
    AuthModule,
    UsersModule,
    AuditModule,
    CompanyModule,
    KeycloakAdminModule,
    ProjectsModule,
    NotificationsModule,
    DiligencesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: (auditService: AuditService, reflector: Reflector) =>
        new AuditInterceptor(auditService, reflector),
      inject: [AuditService, Reflector],
    },
    { provide: APP_INTERCEPTOR, useClass: UpdateLastSeenInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}