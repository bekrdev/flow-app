import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, Minus, Edit2, Trash2, Download } from 'lucide-react'
import { useStore } from '@/stores/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { EmptyState } from '@/components/ui/EmptyState'
import { ItemSheet } from './ItemSheet'
import { haptic, debounce, shareFile } from '@/lib/utils'
import { toast } from 'sonner'
import type { Item } from '@/types'

// CSV Export helper
async function exportItemsToCSV(items: Item[]) {
    const BOM = '\ufeff'
    const header = ['Nombre', 'Cantidad', 'Categoría', 'Ubicación', 'Notas', 'Creada'].join(',')

    const rows = items.map(item => [
        `"${(item.name || '').replace(/"/g, '""')}"`,
        item.quantity,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(item.createdAt).toLocaleDateString('es-UY')}"`,
    ].join(','))

    const csv = BOM + header + '\n' + rows.join('\n')
    const file = new File([csv], `flow-inventario-${new Date().toISOString().split('T')[0]}.csv`, { type: 'text/csv;charset=utf-8;' })

    const shared = await shareFile(file, 'Exportar Inventario', 'CSV de Inventario Flow')
    if (!shared) {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
    }
}

export function InventoryPage() {
    const { items, updateItem, removeItem } = useStore()
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Item | null>(null)

    // Get unique categories from items
    const categories = useMemo(() => {
        const cats = new Set<string>()
        items.forEach(item => {
            if (item.category) cats.add(item.category)
        })
        return Array.from(cats).sort()
    }, [items])

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = !search ||
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.category?.toLowerCase().includes(search.toLowerCase()) ||
                item.location?.toLowerCase().includes(search.toLowerCase())

            const matchesCategory = !activeCategory || item.category === activeCategory

            return matchesSearch && matchesCategory
        })
    }, [items, search, activeCategory])

    // Debounced search handler
    const handleSearchChange = useCallback(
        debounce((value: string) => setSearch(value), 150),
        []
    )

    // Quick quantity adjustments
    const adjustQuantity = (item: Item, delta: number) => {
        haptic('light')
        const newQty = Math.max(0, item.quantity + delta)
        updateItem(item.id, { quantity: newQty })
        if (delta > 0) {
            toast.success(`+${delta} ${item.name}`)
        } else {
            toast(`${delta} ${item.name}`)
        }
    }

    const handleDelete = (item: Item) => {
        if (confirm(`¿Eliminar "${item.name}"?`)) {
            haptic('medium')
            removeItem(item.id)
            toast.success('Item eliminado')
        }
    }

    const handleEdit = (item: Item) => {
        setEditingItem(item)
        setSheetOpen(true)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setSheetOpen(true)
    }

    const handleSheetClose = () => {
        setSheetOpen(false)
        setEditingItem(null)
    }

    const handleExport = () => {
        exportItemsToCSV(items)
        haptic('light')
        toast.success('Inventario exportado a CSV')
    }

    return (
        <div className="page safe-top">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-title">Inventario</h1>
                    <Button variant="secondary" size="sm" onClick={handleExport}>
                        <Download size={16} />
                        CSV
                    </Button>
                </div>

                {/* Search */}
                <Input
                    type="search"
                    placeholder="Buscar items..."
                    icon={<Search size={18} />}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="mb-3"
                />

                {/* Category Pills */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                        <Pill
                            active={activeCategory === null}
                            onClick={() => setActiveCategory(null)}
                        >
                            Todos
                        </Pill>
                        {categories.map(cat => (
                            <Pill
                                key={cat}
                                active={activeCategory === cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                            >
                                {cat}
                            </Pill>
                        ))}
                    </div>
                )}
            </div>

            {/* Items List */}
            <div className="page-content">
                {filteredItems.length === 0 ? (
                    <EmptyState
                        title={search || activeCategory ? 'Sin resultados' : 'Sin items'}
                        description={
                            search || activeCategory
                                ? 'Intenta con otros términos de búsqueda'
                                : 'Agrega tu primer item al inventario'
                        }
                        action={
                            !search && !activeCategory && (
                                <Button onClick={handleAdd}>
                                    <Plus size={18} />
                                    Agregar Item
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="item-card animate-fade-in">
                                {/* Quantity Badge */}
                                <div className="item-card-quantity">
                                    {item.quantity}
                                </div>

                                {/* Content */}
                                <div className="item-card-content">
                                    <div className="item-card-name">{item.name}</div>
                                    <div className="item-card-meta">
                                        {[item.category, item.location].filter(Boolean).join(' · ') || 'Sin categoría'}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => adjustQuantity(item, -1)}
                                        className="btn-icon btn-ghost"
                                        aria-label="Restar 1"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <button
                                        onClick={() => adjustQuantity(item, 1)}
                                        className="btn-icon btn-ghost text-accent"
                                        aria-label="Sumar 1"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="btn-icon btn-ghost"
                                        aria-label="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="btn-icon btn-ghost text-danger"
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB - Add Button */}
            <button className="btn-fab" onClick={handleAdd} aria-label="Agregar item">
                <Plus size={24} />
            </button>

            {/* Item Sheet */}
            <ItemSheet
                open={sheetOpen}
                onClose={handleSheetClose}
                item={editingItem}
            />
        </div>
    )
}
