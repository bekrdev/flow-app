import { useState, useEffect } from 'react'
import { useStore } from '@/stores/store'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import type { Task } from '@/types'

interface TaskSheetProps {
    open: boolean
    onClose: () => void
    task: Task | null
    columnId: string
}

const COLORS = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
]

export function TaskSheet({ open, onClose, task, columnId }: TaskSheetProps) {
    const { addTask, updateTask } = useStore()
    const isEdit = !!task

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.description || '')
            setColor(task.color)
        } else {
            setTitle('')
            setDescription('')
            setColor(undefined)
        }
    }, [task, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast.error('El título es requerido')
            return
        }

        const data = {
            title: title.trim(),
            description: description.trim() || undefined,
            color,
        }

        if (isEdit) {
            updateTask(task.id, data)
            toast.success('Tarea actualizada')
        } else {
            addTask({ ...data, columnId })
            toast.success('Tarea creada')
        }

        onClose()
    }

    return (
        <Sheet open={open} onClose={onClose} title={isEdit ? 'Editar Tarea' : 'Nueva Tarea'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">Título *</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="¿Qué necesitas hacer?"
                        autoFocus
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">Descripción</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detalles adicionales..."
                        className="input min-h-[80px] resize-none"
                    />
                </div>

                {/* Color */}
                <div>
                    <label className="text-small text-text-secondary mb-2 block">Color</label>
                    <div className="flex gap-3">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(color === c ? undefined : c)}
                                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-background scale-110' : ''
                                    }`}
                                style={{ backgroundColor: c }}
                                aria-label={`Color ${c}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                        {isEdit ? 'Guardar' : 'Crear'}
                    </Button>
                </div>
            </form>
        </Sheet>
    )
}
