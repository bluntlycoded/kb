import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { AuthGuard, CurrentUser, RequireFeature, RequirePermission } from '../auth/auth.guard.js';
import { GAME_CATALOG } from './catalog.js';
import { GamesService } from './games.service.js';

@Controller('games')
@UseGuards(AuthGuard)
@RequireFeature('games')
@RequirePermission('games.play')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get('catalog')
  catalog() {
    return GAME_CATALOG;
  }

  @Post('sessions')
  invite(
    @CurrentUser() user: AuthUser,
    @Body() body: { gameKey?: string; inviteeIds?: string[]; quizId?: string },
  ) {
    if (!body?.gameKey || !Array.isArray(body.inviteeIds)) {
      throw new BadRequestException('gameKey and inviteeIds are required');
    }
    return this.games.invite(user, body.gameKey, body.inviteeIds, body.quizId);
  }

  @Get('sessions/:id')
  session(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.games.session(user, id);
  }

  @Post('sessions/:id/respond')
  respond(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { accepted?: boolean }) {
    if (typeof body?.accepted !== 'boolean') throw new BadRequestException('accepted must be true or false');
    return this.games.respond(user, id, body.accepted);
  }
}
