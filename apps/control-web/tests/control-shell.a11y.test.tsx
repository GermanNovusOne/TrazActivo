import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, test } from "vitest";

import ControlHome from "../app/page";
import ControlHealthPage from "../app/health/page";

describe("control-web accessibility", () => {
  test.each([
    ["home", <ControlHome />],
    ["health", <ControlHealthPage />],
  ])("%s has no axe violations", async (_name, page) => {
    const { container } = render(page);

    expect((await axe(container)).violations).toEqual([]);
  });
});
