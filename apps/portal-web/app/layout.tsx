import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@trazactivo/design-system/styles.css";

export const metadata: Metadata = {
  description: "Shell del portal de clientes de TrazActivo.",
  title: "Portal de clientes | TrazActivo",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
