import { Module } from '@nestjs/common';
import { CohortController } from './cohort.controller.js';
import { CohortService } from './cohort.service.js';

@Module({ controllers: [CohortController], providers: [CohortService] })
export class CohortModule {}
