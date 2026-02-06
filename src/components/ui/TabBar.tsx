import { NavLink, useLocation } from 'react-router-dom'
import { Package, CheckSquare, ShoppingCart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
    { path: '/inventory', label: 'Inventario', icon: Package },
    { path: '/tasks', label: 'Tareas', icon: CheckSquare },
    { path: '/purchases', label: 'Compras', icon: ShoppingCart },
    { path: '/settings', label: 'Ajustes', icon: Settings },
]

export function TabBar() {
    const location = useLocation()

    return (
        <nav className="tab-bar">
            {tabs.map(({ path, label, icon: Icon }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={cn(
                        'tab-item',
                        location.pathname === path && 'active'
                    )}
                >
                    <Icon />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
