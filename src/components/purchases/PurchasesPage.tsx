import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, Edit2, ChevronRight, Download } from 'lucide-react'
import { useStore } from '@/stores/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { EmptyState } from '@/components/ui/EmptyState'
import { PurchaseSheet } from './PurchaseSheet'
import { haptic, formatRelativeTime, shareFile, now } from '@/lib/utils'
import { toast } from 'sonner'
import type { Purchase } from '@/types'

// CSV Export helper
async function exportPurchasesToCSV(purchases: Purchase[]) {
    const BOM = '\ufeff'
    const header = [
        'Descripción', 'Tipo', 'Categoría', 'Monto', 'Moneda', 'Precio Unit.', 'Cant.',
        'Solicitud', 'OI', 'Pedido', 'Factura',
        'Fondos', 'Lib A', 'Lib B', 'Pet. Oferta', 'Rec. Ofertas',
        'Est. Téc', 'UGP', 'Adjudicado', 'Notificado',
        'Ofertas Ind.', 'Hojas Servicio', 'Docs Acept.', 'Notas', 'Creada'
    ].join(',')

    const rows = purchases.map(p => {
        const individualOffers = (p.individualOfferRequests || []).map(o => `${o.company} (${o.number})`).join('; ')
        const serviceSheets = (p.serviceSheets || []).join('; ')
        const acceptanceDocs = (p.acceptanceDocs || []).join('; ')

        return [
            `"${(p.description || '').replace(/"/g, '""')}"`,
            `"${p.type === 'direct' ? 'Directa' : 'Almacén'}"`,
            `"${p.category === 'service' ? 'Servicio' : 'Producto'}"`,
            p.amount || '',
            `"${p.currency || 'UYU'}"`,
            p.unitPrice || '',
            p.quantity || '',
            `"${p.requestNumber || ''}"`,
            `"${p.investmentOrder || ''}"`,
            `"${p.orderNumber || ''}"`,
            `"${p.invoice || ''}"`,
            p.fundsStatus ? 'SI' : 'NO',
            p.liberationA ? 'SI' : 'NO',
            p.liberationB ? 'SI' : 'NO',
            `"${p.offerRequest || ''}"`,
            `"${p.offerReceptionDate || ''}"`,
            p.technicalStudy ? 'SI' : 'NO',
            p.sentToUCP ? 'SI' : 'NO',
            p.adjudication ? 'SI' : 'NO',
            p.notification ? 'SI' : 'NO',
            `"${individualOffers.replace(/"/g, '""')}"`,
            `"${serviceSheets.replace(/"/g, '""')}"`,
            `"${acceptanceDocs.replace(/"/g, '""')}"`,
            `"${(p.notes || '').replace(/"/g, '""')}"`,
            `"${new Date(p.createdAt).toLocaleDateString('es-UY')}"`,
        ].join(',')
    })

    const csv = BOM + header + '\n' + rows.join('\n')
    const file = new File([csv], `flow-compras-${now().split('T')[0]}.csv`, { type: 'text/csv;charset=utf-8' })

    const shared = await shareFile(file, 'Exportar Compras', 'CSV de Compras Flow')
    if (!shared) {
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
    }
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
    if ((p.individualOfferRequests?.length || 0) > 0 || p.offerReceptionDate) return { label: 'Ofertas', progress: 22 }
    if (p.offerRequest) return { label: 'Pet. Oferta', progress: 20 }
    if (p.liberationB) return { label: 'Liberado B', progress: 18 }
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
                p.requestNumber?.toLowerCase().includes(search.toLowerCase()) ||
                p.orderNumber?.toLowerCase().includes(search.toLowerCase())

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
        toast.success('Exportando compras...')
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
                    placeholder="Buscar por descripción, solicitud, pedido..."
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
                    <div className="space-y-3 pb-20">
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
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
                                            style={{
                                                background: `conic-gradient(var(--accent) ${stage.progress}%, var(--bg-glass) 0%)`,
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-md bg-bg-card flex items-center justify-center text-[10px] sm:text-xs">
                                                {stage.progress}%
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary truncate">
                                                {purchase.description}
                                            </div>
                                            <div className="text-small text-text-muted flex items-center gap-2">
                                                <span className={`pill ${purchase.type === 'direct' ? 'pill-active' : ''} py-0 text-[10px] px-1.5 h-4`}>
                                                    {purchase.type === 'direct' ? 'Directa' : 'Almacén'}
                                                </span>
                                                <span>·</span>
                                                <span className="truncate">{stage.label}</span>
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
                                        <div className="border-t border-border-subtle p-4 bg-bg-secondary/30 animate-fade-in text-sm">
                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                                                <div>
                                                    <span className="text-text-muted text-xs block">Categoría</span>
                                                    <span className="text-text-primary font-medium">
                                                        {purchase.category === 'service' ? 'Servicio' : 'Producto'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted text-xs block">Cantidad / Unit.</span>
                                                    <span className="text-text-primary">
                                                        {purchase.quantity || 1} x {purchase.unitPrice || '-'}
                                                    </span>
                                                </div>

                                                {purchase.requestNumber && (
                                                    <div>
                                                        <span className="text-text-muted text-xs block">Solicitud</span>
                                                        <span className="text-text-primary">{purchase.requestNumber}</span>
                                                    </div>
                                                )}
                                                {purchase.orderNumber && (
                                                    <div>
                                                        <span className="text-text-muted text-xs block">Pedido</span>
                                                        <span className="text-text-primary">{purchase.orderNumber}</span>
                                                    </div>
                                                )}
                                                {purchase.investmentOrder && (
                                                    <div>
                                                        <span className="text-text-muted text-xs block">Orden Inversión</span>
                                                        <span className="text-text-primary">{purchase.investmentOrder}</span>
                                                    </div>
                                                )}
                                                {purchase.invoice && (
                                                    <div>
                                                        <span className="text-text-muted text-xs block">Factura</span>
                                                        <span className="text-text-primary">{purchase.invoice}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Advanced Status Info (Offer dates, etc) */}
                                            {(purchase.offerRequest || purchase.offerReceptionDate) && (
                                                <div className="mb-4 p-2 bg-bg-glass rounded border border-border-subtle">
                                                    {purchase.offerRequest && (
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-text-muted">Pet. Oferta:</span>
                                                            <span>{purchase.offerRequest}</span>
                                                        </div>
                                                    )}
                                                    {purchase.offerReceptionDate && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-text-muted">Recepción:</span>
                                                            <span>{new Date(purchase.offerReceptionDate + 'T12:00:00').toLocaleDateString('es-UY')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Individual Offers List */}
                                            {purchase.individualOfferRequests && purchase.individualOfferRequests.length > 0 && (
                                                <div className="mb-4">
                                                    <span className="text-text-muted text-xs block mb-1">Ofertas Individuales</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {purchase.individualOfferRequests.map(o => (
                                                            <span key={o.id} className="text-xs bg-bg-glass border border-border-subtle px-2 py-1 rounded">
                                                                {o.company} <span className="text-text-muted">({o.number})</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Acceptance Docs List */}
                                            {purchase.acceptanceDocs && purchase.acceptanceDocs.length > 0 && (
                                                <div className="mb-4">
                                                    <span className="text-text-muted text-xs block mb-1">Docs Recepción/Aceptación</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {purchase.acceptanceDocs.map((doc, i) => (
                                                            <span key={i} className="text-xs bg-accent/10 border border-accent/20 px-2 py-1 rounded text-accent">
                                                                {doc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {purchase.notes && (
                                                <div className="text-sm text-text-secondary mb-4 p-3 bg-bg-secondary rounded italic border border-border-subtle">
                                                    "{purchase.notes}"
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2 border-t border-border-subtle">
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
                                                    className="text-danger px-3"
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
