import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DevAuthMiddleware } from './auth/dev-auth.middleware.js';
import { ChatModule } from './chat/chat.module.js';
import { CohortModule } from './cohort/cohort.module.js';
import { GamesModule } from './games/games.module.js';
import { HealthController } from './health/health.controller.js';
import { NewsModule } from './news/news.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    CohortModule,
    ProfileModule,
    NewsModule,
    ChatModule,
    GamesModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DevAuthMiddleware).forRoutes('*');
  }
}
