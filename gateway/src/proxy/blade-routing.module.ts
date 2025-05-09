import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BladeProxyController } from './blade-proxy.controller';
import { BladeProxyService } from './blade-proxy.service';

@Module({
  controllers: [BladeProxyController],
  providers: [
    BladeProxyService,
    {
      provide: 'SERVICE_ENDPOINTS',
      useFactory: (configService: ConfigService) => ({
        auth: configService.get<string>('AUTH_SERVICE_URL'),
        expense: configService.get<string>('EXPENSE_SERVICE_URL'),
        budget: configService.get<string>('BUDGET_SERVICE_URL'),
        goals: configService.get<string>('GOALS_SERVICE_URL'),
        insights: configService.get<string>('INSIGHTS_SERVICE_URL'),
        chat: configService.get<string>('CHAT_SERVICE_URL'),
        ai: configService.get<string>('AI_INFERENCE_SERVICE_URL'),
        sync: configService.get<string>('SYNC_SERVICE_URL'),
        notification: configService.get<string>('NOTIFICATION_SERVICE_URL'),
        data: configService.get<string>('DATA_SERVICE_URL'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [BladeProxyService],
})
export class BladeRoutingModule {}