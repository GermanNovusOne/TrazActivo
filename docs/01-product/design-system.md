# Design System TrazActivo

## Marca

- Producto: TrazActivo.
- Descriptor: Gestión patrimonial y auxiliar contable.
- Lema: Cada activo tiene una historia verificable.
- Tipografía: Inter.

## Tokens base

```css
:root {
  --color-primary: #17324D;
  --color-primary-hover: #10263A;
  --color-secondary: #19766F;
  --color-accent: #327DA8;
  --color-background: #F5F7F9;
  --color-surface: #FFFFFF;
  --color-text-primary: #202A33;
  --color-text-secondary: #66727D;
  --color-border-subtle: #DCE3E8;
  --color-border-control: #80909D;
  --color-success: #287A59;
  --color-warning: #B7791F;
  --color-warning-text: #7A4F13;
  --color-error: #B42318;
  --color-information: #25689B;
  --color-focus: #327DA8;
  --font-family-base: "Inter", system-ui, sans-serif;
}
```

Los tokens derivados para texto, borde de control y foco deben validarse automáticamente y manualmente contra los fondos reales. Los estados siempre incluyen texto e icono.

## Activos requeridos

```text
assets/branding/logo-horizontal.svg
assets/branding/logo-horizontal-white.svg
assets/branding/isotipo.svg
assets/branding/isotipo-white.svg
assets/branding/favicon.svg
assets/branding/favicon.ico
assets/branding/app-icon-192.png
assets/branding/app-icon-512.png
assets/branding/social-preview.png
```

La imagen incluida en este paquete es referencia visual. No se debe vectorizar automáticamente y asumir fidelidad sin revisión.

## Componentes base

- AppShell.
- Sidebar.
- Topbar.
- ClientSelector.
- ContextSelector para entidad/libro.
- GlobalSearch.
- Breadcrumb.
- DataTable.
- FilterPanel.
- SavedView.
- StatusBadge.
- KPI con drill-down.
- ExceptionCard.
- Timeline.
- EvidenceViewer.
- ApprovalPanel.
- Wizard.
- DocumentUploader.
- QRScanner.
- Empty, loading y error states.
- StepUpAuthDialog.
- FeatureGuard y PermissionGuard visuales.

Los guards del frontend mejoran la experiencia, pero no autorizan operaciones.

## Separación visual

- Portal del cliente: activos, inventario, operaciones, contabilidad y configuración del cliente.
- TrazActivo Control: clientes, lifecycle, health, uso, stamps y auditoría de plataforma.

No se mezclan ambos menús ni se muestra acceso de plataforma a un administrador del cliente.

## Branding por cliente

`ClientBranding` puede modificar logos, colores permitidos, favicon, login, PDF y correo. No puede cambiar colores semánticos para hacer que un riesgo parezca conforme ni alterar montos, estados, fórmulas o evidencia.
