import { clsx, type ClassValue } from 'clsx'

/** Merge class names with clsx */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}

/** Generate UUID v4 */
export function generateId(): string {
    return crypto.randomUUID()
}

/** Get current ISO timestamp */
export function now(): string {
    return new Date().toISOString()
}

/** Format relative time in Spanish */
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000)

    const intervals = [
        { label: 'año', seconds: 31536000 },
        { label: 'mes', seconds: 2592000 },
        { label: 'semana', seconds: 604800 },
        { label: 'día', seconds: 86400 },
        { label: 'hora', seconds: 3600 },
        { label: 'minuto', seconds: 60 },
    ]

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds)
        if (count >= 1) {
            const plural = count !== 1 ? (interval.label === 'mes' ? 'es' : 's') : ''
            return `hace ${count} ${interval.label}${plural}`
        }
    }

    return 'ahora mismo'
}

/** Debounce function */
export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}

/** Check if running as PWA */
export function isPWA(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    )
}

/** Haptic feedback (if available) */
export function haptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if ('vibrate' in navigator) {
        const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30
        navigator.vibrate(duration)
    }
}

/** Download file helper */
export function downloadFile(filename: string, content: string, mimeType: string = 'application/json'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/** Read file as text */
export function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file)
    })
}
