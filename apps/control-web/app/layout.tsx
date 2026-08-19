import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@trazactivo/design-system/styles.css";

export const metadata: Metadata = {
  description: "Shell de TrazActivo Control para operación de plataforma.",
  title: "TrazActivo Control",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
