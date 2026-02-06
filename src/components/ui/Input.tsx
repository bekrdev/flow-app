import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, icon, type = 'text', ...props }, ref) => {
        return (
            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    ref={ref}
                    type={type}
                    className={cn('input', icon && 'input-with-icon', className)}
                    {...props}
                />
            </div>
        )
    }
)

Input.displayName = 'Input'
