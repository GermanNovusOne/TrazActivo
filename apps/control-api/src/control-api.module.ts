import { Module } from "@nestjs/common";

import { TechnicalHealthService } from "./application/technical-health.service.js";
import { HealthController } from "./presentation/health.controller.js";

@Module({
  controllers: [HealthController],
  providers: [TechnicalHealthService],
})
export class ControlApiModule {}
