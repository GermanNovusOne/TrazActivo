import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, test } from "vitest";

import PortalHealthPage from "../app/health/page";
import PortalHome from "../app/page";

describe("portal-web accessibility", () => {
  test.each([
    ["home", <PortalHome />],
    ["health", <PortalHealthPage />],
  ])("%s has no axe violations", async (_name, page) => {
    const { container } = render(page);

    expect((await axe(container)).violations).toEqual([]);
  });
});
