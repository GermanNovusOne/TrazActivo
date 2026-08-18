import {
  Archive,
  Boxes,
  ClipboardList,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { AppShell } from '../../design-system/components/AppShell'
import { EmptyState } from '../../design-system/components/EmptyState'
import type { NavigationItem } from '../../design-system/components/Sidebar'

const navigation: NavigationItem[] = [
  { label: 'Inicio', icon: LayoutDashboard },
  { label: 'Activos', icon: Boxes },
  { label: 'Inventarios', icon: ClipboardList },
  { label: 'Movimientos', icon: MapPin },
  { label: 'Adquisiciones', icon: PackageCheck },
  { label: 'Contabilidad', icon: HandCoins },
  { label: 'Mantenimiento', icon: Archive },
  { label: 'Reportes', icon: FileBarChart },
  { label: 'Auditoría', icon: ShieldCheck },
  { label: 'Configuración', icon: Settings },
]

export function PreviewPage() {
  return (
    <AppShell navigation={navigation}>
      <header className="preview-heading">
        <p className="section-label">AppShell</p>
        <h1>Vista previa</h1>
      </header>
      <EmptyState
        title="Vista previa de interfaz DEV. Sin datos funcionales."
        description="Los módulos de navegación todavía no están implementados."
      />
    </AppShell>
  )
}
