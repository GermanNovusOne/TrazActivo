import type { LucideIcon } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

export interface NavigationItem {
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  items: NavigationItem[]
}

export function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Navegación de vista previa">
      <div className="app-sidebar__heading">
        <span>Navegación</span>
        <StatusBadge label="Sin módulos" tone="neutral" />
      </div>
      <nav aria-label="Módulos previstos">
        <ul className="app-sidebar__list">
          {items.map(({ label, icon: Icon }) => (
            <li key={label}>
              <span className="app-sidebar__item" aria-disabled="true" title="Módulo no implementado">
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
