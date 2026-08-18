import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppShell, ErrorState, LoadingState, StatusBadge } from "../src/index";

describe("minimal design system", () => {
  test("exposes a labelled shell with public navigation", () => {
    render(
      <AppShell
        audienceLabel="Portal de clientes"
        navigation={[
          { current: true, href: "/", label: "Inicio" },
          { href: "/health", label: "Estado del shell" },
        ]}
        variant="portal"
      >
        <h1>Inicio del portal</h1>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Navegación de Portal de clientes" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("main")).toBeTruthy();
  });

  test("loading, error and status states include text semantics", () => {
    render(
      <>
        <LoadingState label="Preparando el portal" />
        <ErrorState message="Intenta nuevamente." title="No pudimos mostrar esta vista" />
        <StatusBadge tone="success">Disponible</StatusBadge>
      </>,
    );

    expect(screen.getByText("Preparando el portal")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Intenta nuevamente");
    expect(screen.getByText("Disponible")).toBeTruthy();
  });
});
