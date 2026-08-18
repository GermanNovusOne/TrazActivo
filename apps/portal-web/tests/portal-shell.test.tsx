import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import ErrorPage from "../app/error";
import PortalHealthPage from "../app/health/page";
import PortalHome from "../app/page";

describe("portal-web shell", () => {
  test("renders a portal-only navigation and smoke surface", () => {
    render(<PortalHome />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "operación patrimonial",
    );
    expect(
      screen.getByRole("navigation", { name: "Navegación de Portal de clientes" }),
    ).toBeTruthy();
    expect(screen.queryByText("Administración SaaS")).toBeNull();
    expect(screen.getByText("Sin mezclar superficies de plataforma.")).toBeTruthy();
  });

  test("supports a logical keyboard entry order", async () => {
    const user = userEvent.setup();
    render(<PortalHome />);

    await user.tab();
    expect(document.activeElement?.textContent).toContain("Saltar al contenido principal");
    await user.tab();
    expect(document.activeElement?.textContent).toContain("Inicio");
  });

  test("shows a visual-only health status", () => {
    render(<PortalHealthPage />);

    expect(screen.getByText("portal-web")).toBeTruthy();
    expect(screen.getByText("No conectados")).toBeTruthy();
  });

  test("does not reveal errors, stack traces or configuration", () => {
    const sensitiveError = new Error("DATABASE_URL=secret.example; stack=internal");
    render(<ErrorPage error={sensitiveError} reset={vi.fn()} />);

    expect(document.body.textContent).not.toContain("DATABASE_URL");
    expect(document.body.textContent).not.toContain("secret.example");
    expect(document.body.textContent).not.toContain("stack=internal");
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
