import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { AuthGuard, CurrentUser, RequirePermission } from '../auth/auth.guard.js';
import { ProfileService } from './profile.service.js';

@Controller()
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get('profiles/me')
  me(@CurrentUser() user: AuthUser) {
    return this.profiles.me(user);
  }

  @Get('profiles/:id')
  byId(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.profiles.byId(user, id);
  }

  @Get('people')
  @RequirePermission('profile.read.team')
  people(@CurrentUser() user: AuthUser, @Query('teamId') teamId?: string) {
    return this.profiles.people(user, teamId);
  }
}
