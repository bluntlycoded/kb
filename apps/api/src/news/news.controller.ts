import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { AuthGuard, CurrentUser, RequireFeature } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Serves cached articles. Filling NewsArticle (a scheduled fetch from a news
 * provider) is pending the client's choice of provider.
 */
@Controller('news')
@UseGuards(AuthGuard)
@RequireFeature('news')
export class NewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query('category') category?: string) {
    if (category !== 'LOCAL' && category !== 'SECTOR') {
      throw new BadRequestException('category must be LOCAL or SECTOR');
    }
    const me = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { office: { select: { region: true } }, tenant: { select: { sector: true } } },
    });
    const where =
      category === 'LOCAL'
        ? { category: 'LOCAL' as const, region: me.office?.region ?? '__none__' }
        : { category: 'SECTOR' as const, sector: me.tenant.sector };
    return this.prisma.newsArticle.findMany({ where, orderBy: { publishedAt: 'desc' }, take: 30 });
  }
}
