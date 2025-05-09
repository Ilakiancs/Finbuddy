import { All, Controller, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BladeProxyService } from './blade-proxy.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api')
export class BladeProxyController {
  constructor(private readonly proxyService: BladeProxyService) {}

  // Health check endpoint - always public
  @Public()
  @All('health')
  health(@Res() res: Response) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: this.proxyService.getAvailableServices(),
    });
  }

  // Auth blade endpoints - public for login/register
  @Public()
  @All('auth/*')
  authProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('auth');
    return handler(req, res);
  }

  // Chat blade endpoints - protected by default unless marked as public in the blade
  @All('chat/*')
  chatProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('chat');
    return handler(req, res);
  }

  // AI inference blade endpoints
  @All('ai/*')
  aiProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('ai');
    return handler(req, res);
  }

  // Expense blade endpoints
  @All('expense/*')
  expenseProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('expense');
    return handler(req, res);
  }

  // Budget blade endpoints
  @All('budget/*')
  budgetProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('budget');
    return handler(req, res);
  }

  // Goals blade endpoints
  @All('goals/*')
  goalsProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('goals');
    return handler(req, res);
  }

  // Insights blade endpoints
  @All('insights/*')
  insightsProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('insights');
    return handler(req, res);
  }

  // Sync blade endpoints
  @All('sync/*')
  syncProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('sync');
    return handler(req, res);
  }

  // Notification blade endpoints
  @All('notification/*')
  notificationProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('notification');
    return handler(req, res);
  }

  // Data blade endpoints
  @All('data/*')
  dataProxy(@Req() req: Request, @Res() res: Response) {
    const handler = this.proxyService.getProxyHandlerForService('data');
    return handler(req, res);
  }

  // Generic service proxy fallback
  @All(':service/*')
  genericProxy(
    @Param('service') service: string,
    @Req() req: Request, 
    @Res() res: Response
  ) {
    try {
      const handler = this.proxyService.getProxyHandlerForService(service);
      return handler(req, res);
    } catch (error) {
      return res.status(404).json({
        message: `Service '${service}' not found or not configured`,
      });
    }
  }
}