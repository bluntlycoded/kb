import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { AuthGuard, CurrentUser, RequireFeature, RequirePermission } from '../auth/auth.guard.js';
import { ChatService } from './chat.service.js';

/** History and conversation setup. Sending happens over the socket (chat:send). */
@Controller('chat')
@UseGuards(AuthGuard)
@RequireFeature('chat')
@RequirePermission('chat.use')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  conversations(@CurrentUser() user: AuthUser) {
    return this.chat.conversations(user);
  }

  @Post('conversations')
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { type?: 'DIRECT' | 'GROUP'; memberIds?: string[]; name?: string },
  ) {
    if ((body?.type !== 'DIRECT' && body?.type !== 'GROUP') || !Array.isArray(body.memberIds)) {
      throw new BadRequestException('type (DIRECT or GROUP) and memberIds are required');
    }
    return this.chat.create(user, body.type, body.memberIds, body.name);
  }

  @Get('conversations/:id/messages')
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.chat.messages(user, id, cursor);
  }
}
