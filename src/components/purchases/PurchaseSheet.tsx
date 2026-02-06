import { useState, useEffect } from 'react'
import { useStore } from '@/stores/store'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { Purchase, PurchaseType } from '@/types'

interface PurchaseSheetProps {
    open: boolean
    onClose: () => void
    purchase: Purchase | null
}

export function PurchaseSheet({ open, onClose, purchase }: PurchaseSheetProps) {
    const { addPurchase, updatePurchase } = useStore()
    const isEdit = !!purchase

    // Essential fields always visible
    const [type, setType] = useState<PurchaseType>('direct')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState<number | ''>('')
    const [currency, setCurrency] = useState<'UYU' | 'USD'>('UYU')
    const [requestNumber, setRequestNumber] = useState('')

    // Extended fields - collapsible
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')
    const [investmentOrder, setInvestmentOrder] = useState('')
    const [invoice, setInvoice] = useState('')
    const [notes, setNotes] = useState('')

    // Checkboxes
    const [fundsStatus, setFundsStatus] = useState(false)
    const [liberationA, setLiberationA] = useState(false)
    const [liberationB, setLiberationB] = useState(false)
    const [technicalStudy, setTechnicalStudy] = useState(false)
    const [sentToUCP, setSentToUCP] = useState(false)
    const [adjudication, setAdjudication] = useState(false)
    const [notification, setNotification] = useState(false)

    useEffect(() => {
        if (purchase) {
            setType(purchase.type)
            setDescription(purchase.description)
            setAmount(purchase.amount || '')
            setCurrency(purchase.currency || 'UYU')
            setRequestNumber(purchase.requestNumber || '')
            setOrderNumber(purchase.orderNumber || '')
            setInvestmentOrder(purchase.investmentOrder || '')
            setInvoice(purchase.invoice || '')
            setNotes(purchase.notes || '')
            setFundsStatus(purchase.fundsStatus || false)
            setLiberationA(purchase.liberationA || false)
            setLiberationB(purchase.liberationB || false)
            setTechnicalStudy(purchase.technicalStudy || false)
            setSentToUCP(purchase.sentToUCP || false)
            setAdjudication(purchase.adjudication || false)
            setNotification(purchase.notification || false)
            setShowAdvanced(true) // Show advanced if editing
        } else {
            setType('direct')
            setDescription('')
            setAmount('')
            setCurrency('UYU')
            setRequestNumber('')
            setOrderNumber('')
            setInvestmentOrder('')
            setInvoice('')
            setNotes('')
            setFundsStatus(false)
            setLiberationA(false)
            setLiberationB(false)
            setTechnicalStudy(false)
            setSentToUCP(false)
            setAdjudication(false)
            setNotification(false)
            setShowAdvanced(false)
        }
    }, [purchase, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!description.trim()) {
            toast.error('La descripción es requerida')
            return
        }

        const data: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'> = {
            type,
            description: description.trim(),
            amount: amount ? Number(amount) : undefined,
            currency,
            requestNumber: requestNumber.trim() || undefined,
            orderNumber: orderNumber.trim() || undefined,
            investmentOrder: investmentOrder.trim() || undefined,
            invoice: invoice.trim() || undefined,
            notes: notes.trim() || undefined,
            fundsStatus,
            liberationA,
            liberationB,
            technicalStudy,
            sentToUCP,
            adjudication,
            notification,
        }

        if (isEdit) {
            updatePurchase(purchase.id, data)
            toast.success('Compra actualizada')
        } else {
            addPurchase(data)
            toast.success('Compra registrada')
        }

        onClose()
    }

    return (
        <Sheet open={open} onClose={onClose} title={isEdit ? 'Editar Compra' : 'Nueva Compra'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                    <label className="text-small text-text-secondary mb-2 block">Tipo</label>
                    <div className="flex gap-2">
                        <Pill
                            active={type === 'direct'}
                            onClick={() => setType('direct')}
                            className="flex-1 justify-center"
                        >
                            Compra Directa
                        </Pill>
                        <Pill
                            active={type === 'warehouse'}
                            onClick={() => setType('warehouse')}
                            className="flex-1 justify-center"
                        >
                            Almacén
                        </Pill>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">
                        Descripción *
                    </label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Compra de materiales oficina"
                        required
                    />
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <label className="text-small text-text-secondary mb-1 block">Monto</label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="text-small text-text-secondary mb-1 block">Moneda</label>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setCurrency('UYU')}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${currency === 'UYU' ? 'bg-accent text-text-inverse' : 'bg-bg-glass text-text-secondary'
                                    }`}
                            >
                                UYU
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrency('USD')}
                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${currency === 'USD' ? 'bg-accent text-text-inverse' : 'bg-bg-glass text-text-secondary'
                                    }`}
                            >
                                USD
                            </button>
                        </div>
                    </div>
                </div>

                {/* Request Number */}
                <div>
                    <label className="text-small text-text-secondary mb-1 block">
                        Nº Solicitud/Reserva
                    </label>
                    <Input
                        value={requestNumber}
                        onChange={(e) => setRequestNumber(e.target.value)}
                        placeholder="Ej: 10001234"
                    />
                </div>

                {/* Advanced Fields Toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showAdvanced ? 'Menos campos' : 'Más campos'}
                </button>

                {/* Advanced Fields */}
                {showAdvanced && (
                    <div className="space-y-4 pt-2 border-t border-border-subtle animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-small text-text-secondary mb-1 block">Nº Pedido</label>
                                <Input
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-small text-text-secondary mb-1 block">Orden Inversión</label>
                                <Input
                                    value={investmentOrder}
                                    onChange={(e) => setInvestmentOrder(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-small text-text-secondary mb-1 block">Factura</label>
                            <Input
                                value={invoice}
                                onChange={(e) => setInvoice(e.target.value)}
                            />
                        </div>

                        {/* Checkboxes */}
                        {type === 'direct' && (
                            <div className="space-y-2">
                                <label className="text-small text-text-secondary block">Estado</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Fondos', value: fundsStatus, set: setFundsStatus },
                                        { label: 'Liberación A', value: liberationA, set: setLiberationA },
                                        { label: 'Liberación B', value: liberationB, set: setLiberationB },
                                        { label: 'Est. Técnico', value: technicalStudy, set: setTechnicalStudy },
                                        { label: 'Enviado UGP', value: sentToUCP, set: setSentToUCP },
                                        { label: 'Adjudicación', value: adjudication, set: setAdjudication },
                                        { label: 'Notificación', value: notification, set: setNotification },
                                    ].map(({ label, value, set }) => (
                                        <label
                                            key={label}
                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${value ? 'bg-accent-subtle text-accent' : 'bg-bg-glass text-text-secondary'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => set(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${value ? 'bg-accent border-accent' : 'border-border-subtle'
                                                }`}>
                                                {value && <span className="text-text-inverse text-xs">✓</span>}
                                            </div>
                                            <span className="text-sm">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-small text-text-secondary mb-1 block">Notas</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input min-h-[60px] resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                        {isEdit ? 'Guardar' : 'Registrar'}
                    </Button>
                </div>
            </form>
        </Sheet>
    )
}
