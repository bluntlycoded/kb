import { Module } from '@nestjs/common';
import { NewsController } from './news.controller.js';

@Module({ controllers: [NewsController] })
export class NewsModule {}
