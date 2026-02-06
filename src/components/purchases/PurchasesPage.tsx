import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, Edit2, ChevronRight, Download } from 'lucide-react'
import { useStore } from '@/stores/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { EmptyState } from '@/components/ui/EmptyState'
import { PurchaseSheet } from './PurchaseSheet'
import { haptic, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Purchase } from '@/types'

// CSV Export helper
function exportPurchasesToCSV(purchases: Purchase[]) {
    const BOM = '\ufeff'
    const header = [
        'Descripción', 'Tipo', 'Monto', 'Moneda', 'Solicitud',
        'Pedido', 'OI', 'Factura', 'Estado Fondos', 'Lib A', 'Lib B',
        'UGP', 'Adjudicado', 'Notificado', 'Notas', 'Creada'
    ].join(',')

    const rows = purchases.map(p => [
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${p.type === 'direct' ? 'Directa' : 'Almacén'}"`,
        p.amount || '',
        `"${p.currency || 'UYU'}"`,
        `"${p.requestNumber || ''}"`,
        `"${p.orderNumber || ''}"`,
        `"${p.investmentOrder || ''}"`,
        `"${p.invoice || ''}"`,
        p.fundsStatus ? 'SI' : 'NO',
        p.liberationA ? 'SI' : 'NO',
        p.liberationB ? 'SI' : 'NO',
        p.sentToUCP ? 'SI' : 'NO',
        p.adjudication ? 'SI' : 'NO',
        p.notification ? 'SI' : 'NO',
        `"${(p.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(p.createdAt).toLocaleDateString('es-UY')}"`,
    ].join(','))

    const csv = BOM + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `flow-compras-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

// Simplified stage calculation
function getStage(p: Purchase): { label: string; progress: number } {
    if (p.invoice) return { label: 'Facturado', progress: 100 }
    if (p.acceptanceDocs?.length) return { label: 'Aceptación', progress: 85 }
    if (p.serviceSheets?.length) return { label: 'Servicio', progress: 75 }
    if (p.notification) return { label: 'Notificado', progress: 65 }
    if (p.adjudication) return { label: 'Adjudicado', progress: 55 }
    if (p.orderNumber) return { label: 'Con Pedido', progress: 45 }
    if (p.sentToUCP) return { label: 'En UGP', progress: 35 }
    if (p.technicalStudy) return { label: 'Est. Técnico', progress: 25 }
    if (p.liberationB) return { label: 'Liberado B', progress: 20 }
    if (p.liberationA) return { label: 'Liberado A', progress: 15 }
    if (p.fundsStatus) return { label: 'Fondos OK', progress: 10 }
    if (p.requestNumber) return { label: 'Con Solicitud', progress: 5 }
    return { label: 'Inicio', progress: 0 }
}

export function PurchasesPage() {
    const { purchases, removePurchase } = useStore()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'direct' | 'warehouse'>('all')
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const filteredPurchases = useMemo(() => {
        return (purchases || []).filter(p => {
            const matchesSearch = !search ||
                p.description.toLowerCase().includes(search.toLowerCase()) ||
                p.requestNumber?.toLowerCase().includes(search.toLowerCase())

            const matchesType = typeFilter === 'all' || p.type === typeFilter

            return matchesSearch && matchesType
        })
    }, [purchases, search, typeFilter])

    const handleDelete = (purchase: Purchase) => {
        if (confirm(`¿Eliminar "${purchase.description}"?`)) {
            haptic('medium')
            removePurchase(purchase.id)
            toast.success('Compra eliminada')
        }
    }

    const handleEdit = (purchase: Purchase) => {
        setEditingPurchase(purchase)
        setSheetOpen(true)
    }

    const handleAdd = () => {
        setEditingPurchase(null)
        setSheetOpen(true)
    }

    const handleExport = () => {
        exportPurchasesToCSV(purchases || [])
        haptic('light')
        toast.success('Compras exportadas a CSV')
    }

    const formatCurrency = (amount?: number, currency?: string) => {
        if (!amount) return '-'
        return `${currency || 'UYU'} ${amount.toLocaleString()}`
    }

    return (
        <div className="page safe-top">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-title">Compras SAP</h1>
                    <Button variant="secondary" size="sm" onClick={handleExport}>
                        <Download size={16} />
                        CSV
                    </Button>
                </div>

                {/* Search */}
                <Input
                    type="search"
                    placeholder="Buscar por descripción o solicitud..."
                    icon={<Search size={18} />}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-3"
                />

                {/* Type Filter */}
                <div className="flex gap-2">
                    <Pill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
                        Todas
                    </Pill>
                    <Pill active={typeFilter === 'direct'} onClick={() => setTypeFilter('direct')}>
                        Directas
                    </Pill>
                    <Pill active={typeFilter === 'warehouse'} onClick={() => setTypeFilter('warehouse')}>
                        Almacén
                    </Pill>
                </div>
            </div>

            {/* Purchases List */}
            <div className="page-content">
                {filteredPurchases.length === 0 ? (
                    <EmptyState
                        title={search || typeFilter !== 'all' ? 'Sin resultados' : 'Sin compras'}
                        description={
                            search || typeFilter !== 'all'
                                ? 'Intenta con otros filtros'
                                : 'Agrega tu primera compra'
                        }
                        action={
                            !search && typeFilter === 'all' && (
                                <Button onClick={handleAdd}>
                                    <Plus size={18} />
                                    Nueva Compra
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredPurchases.map((purchase) => {
                            const stage = getStage(purchase)
                            const isExpanded = expandedId === purchase.id

                            return (
                                <div
                                    key={purchase.id}
                                    className="glass-card overflow-hidden animate-fade-in"
                                >
                                    {/* Main Row */}
                                    <div
                                        className="p-3 flex items-center gap-3 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
                                    >
                                        {/* Progress indicator */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                                            style={{
                                                background: `conic-gradient(var(--accent) ${stage.progress}%, var(--bg-glass) 0%)`,
                                            }}
                                        >
                                            <div className="w-7 h-7 rounded-md bg-background flex items-center justify-center text-xs">
                                                {stage.progress}%
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary truncate">
                                                {purchase.description}
                                            </div>
                                            <div className="text-small text-text-muted flex items-center gap-2">
                                                <span className={`pill ${purchase.type === 'direct' ? 'pill-active' : ''} py-0 text-xs`}>
                                                    {purchase.type === 'direct' ? 'Directa' : 'Almacén'}
                                                </span>
                                                <span>·</span>
                                                <span>{stage.label}</span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <div className="text-small font-medium text-accent">
                                                {formatCurrency(purchase.amount, purchase.currency)}
                                            </div>
                                            <div className="text-caption text-text-muted">
                                                {formatRelativeTime(purchase.createdAt)}
                                            </div>
                                        </div>

                                        {/* Chevron */}
                                        <ChevronRight
                                            size={18}
                                            className={`text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        />
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-border-subtle p-3 bg-bg-glass animate-fade-in">
                                            <div className="grid grid-cols-2 gap-3 text-small mb-3">
                                                {purchase.requestNumber && (
                                                    <div>
                                                        <span className="text-text-muted">Solicitud:</span>{' '}
                                                        <span className="text-text-primary">{purchase.requestNumber}</span>
                                                    </div>
                                                )}
                                                {purchase.orderNumber && (
                                                    <div>
                                                        <span className="text-text-muted">Pedido:</span>{' '}
                                                        <span className="text-text-primary">{purchase.orderNumber}</span>
                                                    </div>
                                                )}
                                                {purchase.investmentOrder && (
                                                    <div>
                                                        <span className="text-text-muted">OI:</span>{' '}
                                                        <span className="text-text-primary">{purchase.investmentOrder}</span>
                                                    </div>
                                                )}
                                                {purchase.invoice && (
                                                    <div>
                                                        <span className="text-text-muted">Factura:</span>{' '}
                                                        <span className="text-text-primary">{purchase.invoice}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {purchase.notes && (
                                                <div className="text-small text-text-secondary mb-3 p-2 bg-bg-secondary rounded">
                                                    {purchase.notes}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(purchase) }}
                                                    className="flex-1"
                                                >
                                                    <Edit2 size={16} />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(purchase) }}
                                                    className="text-danger"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button className="btn-fab" onClick={handleAdd} aria-label="Nueva compra">
                <Plus size={24} />
            </button>

            {/* Purchase Sheet */}
            <PurchaseSheet
                open={sheetOpen}
                onClose={() => { setSheetOpen(false); setEditingPurchase(null) }}
                purchase={editingPurchase}
            />
        </div>
    )
}
