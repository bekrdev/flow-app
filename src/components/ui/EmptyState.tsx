import type { ReactNode } from 'react'
import { Package } from 'lucide-react'

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state py-16">
            <div className="empty-state-icon">
                {icon || <Package size={64} />}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            {description && (
                <p className="text-text-muted text-small mt-1 max-w-xs">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
