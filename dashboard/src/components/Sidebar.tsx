import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  FileText,
  CreditCard,
  Settings,
  TrendingUp,
  DollarSign,
  Users,
  LogOut,
  UserCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Visão Geral', roles: null },
    { to: '/activity', icon: Activity, label: 'Atividade', roles: null },
    { to: '/invoices', icon: FileText, label: 'Faturas', roles: null },
    { to: '/subscriptions', icon: CreditCard, label: 'Assinaturas', roles: null },
    { to: '/costs', icon: DollarSign, label: 'Custos de IA', roles: ['ADMIN', 'MASTER'] },
    { to: '/users', icon: Users, label: 'Usuários', roles: ['ADMIN', 'MASTER'] },
    { to: '/settings', icon: Settings, label: 'Configurações', roles: ['MASTER'] },
  ].filter(({ roles }) => !roles || (user && roles.includes(user.role)))

  return (
    <aside className="w-[220px] bg-sidebar flex flex-col">
      <div className="p-5 border-b border-sidebar-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-sidebar-foreground tracking-tight">ServicePay</h1>
            <p className="text-xs text-sidebar-muted">Analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }, index) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "opacity-0 animate-fade-in",
                isActive
                  ? 'bg-sidebar-accent text-primary-foreground shadow-sm'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-muted/20'
              )
            }
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-muted/30 space-y-3">
        {user && (
          <Link
            to="/account"
            className="flex items-center gap-1.5 text-xs text-sidebar-muted hover:text-sidebar-foreground transition-colors truncate"
            title={user.email}
          >
            <UserCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </Link>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sidebar-muted">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs">Sistema operacional</span>
          </div>
          <button
            onClick={logout}
            className="text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-sidebar-muted/60">v0.1.0</p>
      </div>
    </aside>
  )
}
