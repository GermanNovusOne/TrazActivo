import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, test } from "vitest";

import { AppShell, ErrorState, LoadingState } from "../src/index";

describe("design system accessibility", () => {
  test("the shell and its required states have no axe violations", async () => {
    const { container } = render(
      <AppShell
        audienceLabel="Portal de clientes"
        navigation={[
          { current: true, href: "/", label: "Inicio" },
          { href: "/health", label: "Estado del shell" },
        ]}
        variant="portal"
      >
        <h1>Inicio accesible</h1>
        <LoadingState />
        <ErrorState message="Intenta nuevamente." title="Vista no disponible" />
      </AppShell>,
    );

    expect((await axe(container)).violations).toEqual([]);
  });
});
