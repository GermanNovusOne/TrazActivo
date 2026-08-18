import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import ControlHome from "../app/page";
import ErrorPage from "../app/error";
import ControlHealthPage from "../app/health/page";

describe("control-web shell", () => {
  test("renders a platform-only navigation and smoke surface", () => {
    render(<ControlHome />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("vista de plataforma");
    expect(
      screen.getByRole("navigation", { name: "Navegación de TrazActivo Control" }),
    ).toBeTruthy();
    expect(screen.queryByText("Gestión patrimonial")).toBeNull();
    expect(screen.getByText("La operación del cliente vive en otro shell.")).toBeTruthy();
  });

  test("supports a logical keyboard entry order", async () => {
    const user = userEvent.setup();
    render(<ControlHome />);

    await user.tab();
    expect(document.activeElement?.textContent).toContain("Saltar al contenido principal");
    await user.tab();
    expect(document.activeElement?.textContent).toContain("Resumen");
  });

  test("shows a visual-only health status", () => {
    render(<ControlHealthPage />);

    expect(screen.getByText("control-web")).toBeTruthy();
    expect(screen.getByText("No habilitadas")).toBeTruthy();
  });

  test("does not reveal errors, stack traces or configuration", () => {
    const sensitiveError = new Error("PLATFORM_CONNECTION=secret.example; stack=internal");
    render(<ErrorPage error={sensitiveError} reset={vi.fn()} />);

    expect(document.body.textContent).not.toContain("PLATFORM_CONNECTION");
    expect(document.body.textContent).not.toContain("secret.example");
    expect(document.body.textContent).not.toContain("stack=internal");
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
