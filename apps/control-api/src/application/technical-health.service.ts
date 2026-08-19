import { Injectable } from "@nestjs/common";

export const CONTROL_API_HEALTH = Object.freeze({
  service: "control-api",
  plane: "control",
  status: "ok",
  version: "0.0.0",
} as const);

@Injectable()
export class TechnicalHealthService {
  read() {
    return CONTROL_API_HEALTH;
  }
}
