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
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { QuotationModule } from './quotation/quotation.module';
import { InvoiceModule } from './invoices/invoice.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { DocumentSettingsModule } from './document-settings/document-settings.module';
import { WhatsappSettingsModule } from './whatsapp-settings/whatsapp-settings.module';
import { ThemeSettingsModule } from './theme-settings/theme-settings.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Serve uploaded files statically at /uploads/...
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Core modules
    PrismaModule,
    AdminModule,
    AuthModule,
    CompanyModule,
    BranchesModule,
    UsersModule,
    ProfileModule,
    CustomersModule,
    ProductsModule,
    ExpensesModule,
    ExpenseCategoriesModule,
    QuotationModule,
    InvoiceModule,
    DashboardModule,

    // Subscription Management
    SubscriptionPlansModule,
    SubscriptionsModule,
    NotificationsModule,
    DocumentSettingsModule,
    WhatsappSettingsModule,
    ThemeSettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
