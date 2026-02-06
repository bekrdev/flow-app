import { useState, useEffect } from 'react'
import { useStore } from '@/stores/store'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import type { Item } from '@/types'

interface ItemSheetProps {
    open: boolean
    onClose: () => void
    item: Item | null
}

export function ItemSheet({ open, onClose, item }: ItemSheetProps) {
    const { addItem, updateItem } = useStore()
    const isEdit = !!item

    const [name, setName] = useState('')
    const [quantity, setQuantity] = useState(0)
    const [category, setCategory] = useState('')
    const [location, setLocation] = useState('')
    const [notes, setNotes] = useState('')

    // Reset form when item changes
    useEffect(() => {
        if (item) {
            setName(item.name)
            setQuantity(item.quantity)
            setCategory(item.category || '')
            setLocation(item.location || '')
            setNotes(item.notes || '')
        } else {
            setName('')
            setQuantity(0)
            setCategory('')
            setLocation('')
            setNotes('')
        }
    }, [item, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('El nombre es requerido')
            return
        }

        const data = {
            name: name.trim(),
            quantity: Number(quantity),
            category: category.trim() || undefined,
            location: location.trim() || undefined,
            notes: notes.trim() || undefined,
        }

        if (isEdit) {
            updateItem(item.id, data)
            toast.success('Item actualizado')
        } else {
            addItem(data)
            toast.success('Item creado')
        }

        onClose()
    }

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={isEdit ? 'Editar Item' : 'Nuevo Item'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name - Required */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">
                        Nombre *
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Tornillos M8"
                        autoFocus
                        required
                    />
                </div>

                {/* Quantity */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">
                        Cantidad
                    </label>
                    <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min={0}
                    />
                </div>

                {/* Two column layout for category/location */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-small text-text-secondary mb-1 block">
                            Categoría
                        </label>
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ej: Herramientas"
                        />
                    </div>
                    <div>
                        <label className="text-small text-text-secondary mb-1 block">
                            Ubicación
                        </label>
                        <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ej: Estante A1"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">
                        Notas
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notas adicionales..."
                        className="input min-h-[80px] resize-none"
                    />
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
