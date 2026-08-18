import type { ReactNode } from 'react'
import { Breadcrumb } from './Breadcrumb'
import { Sidebar, type NavigationItem } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  navigation: NavigationItem[]
  children: ReactNode
}

export function AppShell({ navigation, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Topbar />
      <Sidebar items={navigation} />
      <main className="app-main" id="main-content">
        <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Vista previa' }]} />
        {children}
      </main>
    </div>
  )
}
