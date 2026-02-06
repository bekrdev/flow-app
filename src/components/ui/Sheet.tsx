import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
    open: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    className?: string
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (open) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <>
            {/* Overlay */}
            <div className="sheet-overlay" onClick={onClose} />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={cn('sheet', className)}
                role="dialog"
                aria-modal="true"
            >
                {/* Handle */}
                <div className="sheet-handle" />

                {/* Header */}
                {title && (
                    <div className="sheet-header">
                        <h2 className="sheet-title">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="sheet-close"
                            aria-label="Cerrar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="sheet-content">{children}</div>
            </div>
        </>
    )
}
