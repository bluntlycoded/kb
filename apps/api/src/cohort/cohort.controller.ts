import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { AuthGuard, CurrentUser, RequireFeature, RequirePermission } from '../auth/auth.guard.js';
import { CohortService } from './cohort.service.js';

@Controller('cohort')
@UseGuards(AuthGuard)
@RequireFeature('cohort')
export class CohortController {
  constructor(private readonly cohort: CohortService) {}

  @Get('feed')
  feed(@CurrentUser() user: AuthUser, @Query('cursor') cursor?: string) {
    return this.cohort.feed(user, cursor);
  }

  @Post('praise')
  @RequirePermission('praise.give')
  givePraise(
    @CurrentUser() user: AuthUser,
    @Body() body: { recipientId?: string; message?: string; kind?: 'PRAISE' | 'ACHIEVEMENT' },
  ) {
    const message = body?.message?.trim();
    if (!body?.recipientId || !message) throw new BadRequestException('recipientId and message are required');
    if (message.length > 1000) throw new BadRequestException('message is too long');
    const kind = body.kind === 'ACHIEVEMENT' ? 'ACHIEVEMENT' : 'PRAISE';
    return this.cohort.givePraise(user, body.recipientId, message, kind);
  }
}
