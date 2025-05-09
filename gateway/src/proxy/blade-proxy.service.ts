import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { RequestHandler } from 'express';

@Injectable()
export class BladeProxyService {
  private readonly logger = new Logger(BladeProxyService.name);
  private proxyHandlers: Record<string, RequestHandler> = {};

  constructor(
    @Inject('SERVICE_ENDPOINTS') private readonly serviceEndpoints: Record<string, string>,
  ) {
    this.initializeProxyHandlers();
  }

  private initializeProxyHandlers(): void {
    Object.entries(this.serviceEndpoints).forEach(([service, target]) => {
      if (target) {
        this.logger.log(`Creating proxy handler for ${service} service: ${target}`);
        this.proxyHandlers[service] = createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: { [`^/api/${service}`]: '' },
          logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
          onProxyReq: (proxyReq, req) => {
            // Forward the user info to the microservice if the original request has it
            if (req['user']) {
              proxyReq.setHeader('X-User-ID', req['user'].id);
              proxyReq.setHeader('X-User-Email', req['user'].email);
              proxyReq.setHeader('X-User-Roles', JSON.stringify(req['user'].roles || []));
            }

            // Forward the original IP and request ID for tracing
            const requestId = req.headers['x-request-id'];
            if (requestId) {
              proxyReq.setHeader('X-Request-ID', requestId);
            }

            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            if (ip) {
              proxyReq.setHeader('X-Forwarded-For', ip.toString());
            }
          },
          onProxyRes: (proxyRes, req, res) => {
            proxyRes.headers['x-proxied-by'] = 'finbuddy-gateway';
          },
          onError: (err, req, res) => {
            this.logger.error(`Proxy error: ${err.message}`, err.stack);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ 
              message: 'Service temporarily unavailable',
              error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
            }));
          },
        });
      }
    });
  }

  getProxyHandlerForService(serviceName: string): RequestHandler {
    const handler = this.proxyHandlers[serviceName];
    if (!handler) {
      throw new NotFoundException(`Service ${serviceName} not found or not configured`);
    }
    return handler;
  }

  getAvailableServices(): string[] {
    return Object.keys(this.proxyHandlers);
  }
}