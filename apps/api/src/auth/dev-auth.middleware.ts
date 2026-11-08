import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RequestWithUser } from './auth-user.js';
import { loadAuthUser } from './load-auth-user.js';

/**
 * Development stand-in for real sign-in (SSO choice is pending with the client).
 * Identifies the caller from the `x-dev-user-id` header. Disabled in production.
 */
@Injectable()
export class DevAuthMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: RequestWithUser, _res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'production') return next();
    const userId = req.header('x-dev-user-id');
    if (!userId) return next();
    try {
      req.authUser = (await loadAuthUser(this.prisma, userId)) ?? undefined;
      next();
    } catch (err) {
      next(err);
    }
  }
}
