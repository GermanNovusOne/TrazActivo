import { Controller, Get, Inject } from "@nestjs/common";

import { TechnicalHealthService } from "../application/technical-health.service.js";

@Controller("health")
export class HealthController {
  constructor(
    @Inject(TechnicalHealthService)
    private readonly technicalHealthService: TechnicalHealthService,
  ) {}

  @Get()
  getHealth() {
    return this.technicalHealthService.read();
  }
}
