import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: ReactNode
    loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    icon: 'btn-icon',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', icon, loading, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'btn',
                    variantClasses[variant],
                    sizeClasses[size],
                    (disabled || loading) && 'btn-disabled',
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <span className="btn-loading">...</span>
                ) : (
                    <>
                        {icon}
                        {children}
                    </>
                )}
            </button>
        )
    }
)

Button.displayName = 'Button'
