import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';

@Module({ imports: [RealtimeModule], controllers: [GamesController], providers: [GamesService] })
export class GamesModule {}
