import { Injectable } from "@nestjs/common";

export const DATA_API_HEALTH = Object.freeze({
  service: "data-api",
  plane: "data",
  status: "ok",
  version: "0.0.0",
} as const);

@Injectable()
export class TechnicalHealthService {
  read() {
    return DATA_API_HEALTH;
  }
}
