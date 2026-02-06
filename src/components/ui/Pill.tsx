import { cn } from '@/lib/utils'

interface PillProps {
    active?: boolean
    onClick?: () => void
    children: React.ReactNode
    className?: string
}

export function Pill({ active, onClick, children, className }: PillProps) {
    const Component = onClick ? 'button' : 'span'

    return (
        <Component
            onClick={onClick}
            className={cn(
                'pill',
                active && 'pill-active',
                onClick && 'cursor-pointer hover:border-accent transition-colors',
                className
            )}
        >
            {children}
        </Component>
    )
}
