import { describe, expect, test } from "vitest";

import { colorTokens, fontTokens } from "../src/tokens";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/gu)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid color token: ${hex}`);
  }

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(first: string, second: string) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

describe("TrazActivo design tokens", () => {
  test("preserves the approved baseline", () => {
    expect(colorTokens.primary).toBe("#17324D");
    expect(colorTokens.secondary).toBe("#19766F");
    expect(colorTokens.accent).toBe("#327DA8");
    expect(colorTokens.error).toBe("#B42318");
    expect(fontTokens.base).toContain("Inter");
  });

  test("keeps primary text combinations at WCAG AA contrast", () => {
    expect(contrast(colorTokens.textPrimary, colorTokens.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colorTokens.textSecondary, colorTokens.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colorTokens.surface, colorTokens.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colorTokens.warningText, colorTokens.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colorTokens.focus, colorTokens.surface)).toBeGreaterThanOrEqual(3);
  });
});
