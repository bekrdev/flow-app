import { useState, useEffect } from 'react'
import { useStore } from '@/stores/store'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Purchase, PurchaseType, IndividualOffer } from '@/types'

interface PurchaseSheetProps {
    open: boolean
    onClose: () => void
    purchase: Purchase | null
}

export function PurchaseSheet({ open, onClose, purchase }: PurchaseSheetProps) {
    const { addPurchase, updatePurchase } = useStore()
    const isEdit = !!purchase

    // --- State ---
    const [type, setType] = useState<PurchaseType>('direct')
    const [category, setCategory] = useState<'product' | 'service'>('product')
    const [description, setDescription] = useState('')

    // Imputación
    const [amount, setAmount] = useState<number | ''>('') // This will be calculated from unit * qty
    const [currency, setCurrency] = useState<'UYU' | 'USD'>('UYU')
    const [unitPrice, setUnitPrice] = useState<number | ''>('')
    const [quantity, setQuantity] = useState<number>(1)
    const [fundsStatus, setFundsStatus] = useState(false)

    // Request & Order
    const [requestNumber, setRequestNumber] = useState('')
    const [orderNumber, setOrderNumber] = useState('')
    const [investmentOrder, setInvestmentOrder] = useState('')
    const [invoice, setInvoice] = useState('')

    // Direct Purchase Process
    const [offerRequest, setOfferRequest] = useState('') // Petición Générica
    const [offerReceptionDate, setOfferReceptionDate] = useState('')
    const [technicalStudy, setTechnicalStudy] = useState(false)
    const [sentToUCP, setSentToUCP] = useState(false)

    // Multi-doc lists
    const [individualOffers, setIndividualOffers] = useState<IndividualOffer[]>([])
    const [newOfferCompany, setNewOfferCompany] = useState('')
    const [newOfferNumber, setNewOfferNumber] = useState('')

    const [acceptanceDocs, setAcceptanceDocs] = useState<string[]>([])
    const [newAcceptanceDoc, setNewAcceptanceDoc] = useState('')

    // Status / Checkboxes
    const [liberationA, setLiberationA] = useState(false)
    const [liberationB, setLiberationB] = useState(false)
    const [adjudication, setAdjudication] = useState(false)
    const [notification, setNotification] = useState(false)

    const [notes, setNotes] = useState('')

    // --- Effects ---
    useEffect(() => {
        if (purchase) {
            setType(purchase.type)
            setCategory(purchase.category || 'product')
            setDescription(purchase.description)
            setAmount(purchase.amount || '')
            setCurrency(purchase.currency || 'UYU')
            setUnitPrice(purchase.unitPrice || '')
            setQuantity(purchase.quantity || 1)
            setFundsStatus(purchase.fundsStatus || false)

            setRequestNumber(purchase.requestNumber || '')
            setOrderNumber(purchase.orderNumber || '')
            setInvestmentOrder(purchase.investmentOrder || '')
            setInvoice(purchase.invoice || '')

            setOfferRequest(purchase.offerRequest || '')
            setOfferReceptionDate(purchase.offerReceptionDate || '')
            setTechnicalStudy(purchase.technicalStudy || false)
            setSentToUCP(purchase.sentToUCP || false)

            setIndividualOffers(purchase.individualOfferRequests || [])
            setAcceptanceDocs(purchase.acceptanceDocs || [])

            setLiberationA(purchase.liberationA || false)
            setLiberationB(purchase.liberationB || false)
            setAdjudication(purchase.adjudication || false)
            setNotification(purchase.notification || false)
            setNotes(purchase.notes || '')
        } else {
            resetForm()
        }
    }, [purchase, open])

    // Auto-calculate total amount
    useEffect(() => {
        if (unitPrice && quantity) {
            setAmount(Number(unitPrice) * quantity)
        }
    }, [unitPrice, quantity])

    const resetForm = () => {
        setType('direct')
        setCategory('product')
        setDescription('')
        setAmount('')
        setCurrency('UYU')
        setUnitPrice('')
        setQuantity(1)
        setFundsStatus(false)
        setRequestNumber('')
        setOrderNumber('')
        setInvestmentOrder('')
        setInvoice('')
        setOfferRequest('')
        setOfferReceptionDate('')
        setTechnicalStudy(false)
        setSentToUCP(false)
        setIndividualOffers([])
        setAcceptanceDocs([])
        setLiberationA(false)
        setLiberationB(false)
        setAdjudication(false)
        setNotification(false)
        setNotes('')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!description.trim()) {
            toast.error('La descripción es requerida')
            return
        }

        const data: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'> = {
            type,
            category,
            description: description.trim(),
            amount: amount ? Number(amount) : undefined,
            currency,
            unitPrice: unitPrice ? Number(unitPrice) : undefined,
            quantity,
            requestNumber: requestNumber.trim() || undefined,
            orderNumber: orderNumber.trim() || undefined,
            investmentOrder: investmentOrder.trim() || undefined,
            invoice: invoice.trim() || undefined,
            offerRequest: offerRequest.trim() || undefined,
            offerReceptionDate: offerReceptionDate || undefined,
            individualOfferRequests: individualOffers,
            acceptanceDocs: acceptanceDocs,
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

    // --- Helpers for Lists ---
    const addIndividualOffer = () => {
        if (!newOfferCompany.trim()) return
        const newOffer: IndividualOffer = {
            id: crypto.randomUUID(),
            company: newOfferCompany.trim(),
            number: newOfferNumber.trim()
        }
        setIndividualOffers([...individualOffers, newOffer])
        setNewOfferCompany('')
        setNewOfferNumber('')
    }

    const removeIndividualOffer = (id: string) => {
        setIndividualOffers(individualOffers.filter(o => o.id !== id))
    }

    const addAcceptanceDoc = () => {
        if (!newAcceptanceDoc.trim()) return
        setAcceptanceDocs([...acceptanceDocs, newAcceptanceDoc.trim()])
        setNewAcceptanceDoc('')
    }

    const removeAcceptanceDoc = (index: number) => {
        setAcceptanceDocs(acceptanceDocs.filter((_, i) => i !== index))
    }

    const getStageLabel = () => {
        // Simple logic to show current stage text
        if (invoice) return 'Facturado'
        if (acceptanceDocs.length > 0) return 'Aceptación'
        if (notification) return 'Notificado'
        if (adjudication) return 'Adjudicado'
        if (orderNumber) return 'Con Pedido'
        if (sentToUCP) return 'En UGP'
        if (technicalStudy) return 'Estudio Técnico'
        if (individualOffers.length > 0 || offerReceptionDate) return 'Ofertas'
        if (offerRequest) return 'Petición Oferta'
        if (requestNumber) return 'Solicitado'
        return 'Inicio: Sin datos'
    }

    return (
        <Sheet open={open} onClose={onClose} title={isEdit ? 'Editar Compra' : 'Registrar Compra SAP'}>
            <form onSubmit={handleSubmit} className="space-y-6 pb-safe">
                {/* 1. Tipo & Categoria */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tipo de Compra</label>
                        <select
                            className="input w-full"
                            value={type}
                            onChange={(e) => setType(e.target.value as PurchaseType)}
                        >
                            <option value="direct">Compra Directa</option>
                            <option value="warehouse">Almacén</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Categoría</label>
                        <select
                            className="input w-full"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                        >
                            <option value="product">Producto</option>
                            <option value="service">Servicio</option>
                        </select>
                    </div>
                </div>

                {/* 2. Objeto */}
                <div>
                    <label className="label">Objeto (Descripción)</label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Toner Pantum"
                        required
                    />
                </div>

                {/* 3. Etapa Actual (Read Only) */}
                <div>
                    <label className="label text-accent">Etapa Actual</label>
                    <div className="input bg-accent/5 border-accent/20 text-accent font-medium flex items-center">
                        {getStageLabel()}
                    </div>
                </div>

                {/* 4. Imputación */}
                <div className="card p-3 space-y-3 border-border-subtle bg-bg-secondary/30">
                    <h3 className="section-title">Imputación</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Moneda</label>
                            <select
                                className="input w-full"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as any)}
                            >
                                <option value="UYU">UYU</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Precio Unitario</label>
                            <Input
                                type="number"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Cantidad</label>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="label">Total</label>
                            <div className="input bg-bg-secondary text-text-muted flex items-center">
                                {amount ? amount.toLocaleString() : '0'}
                            </div>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={fundsStatus}
                            onChange={(e) => setFundsStatus(e.target.checked)}
                            className="checkbox"
                        />
                        <span className="text-sm">Fondos Imputados</span>
                    </label>
                </div>

                {/* 5. Solicitud & OI */}
                <div className="space-y-3">
                    <div>
                        <label className="label">Solicitud Pedido</label>
                        <Input
                            value={requestNumber}
                            onChange={(e) => setRequestNumber(e.target.value)}
                            placeholder="Nº Solicitud"
                        />
                    </div>
                    <div>
                        <label className="label">Orden de Inversión</label>
                        <Input
                            value={investmentOrder}
                            onChange={(e) => setInvestmentOrder(e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>
                </div>

                {/* 6. Proceso de Ofertas (Solo Directa) */}
                {type === 'direct' && (
                    <div className="card p-3 space-y-4 border-border-subtle bg-bg-secondary/30">
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={liberationA}
                                    onChange={(e) => setLiberationA(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="text-sm">Liberación A</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={liberationB}
                                    onChange={(e) => setLiberationB(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="text-sm">Liberación B</span>
                            </label>
                        </div>

                        <div>
                            <label className="label">Petición Oferta Genérica</label>
                            <Input
                                value={offerRequest}
                                onChange={(e) => setOfferRequest(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="label">Recepción Ofertas</label>
                            <Input
                                type="date"
                                value={offerReceptionDate}
                                onChange={(e) => setOfferReceptionDate(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={technicalStudy}
                                    onChange={(e) => setTechnicalStudy(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="text-sm">Estudio Técnico</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sentToUCP}
                                    onChange={(e) => setSentToUCP(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="text-sm">Enviado a UGP?</span>
                            </label>
                        </div>

                        {/* Peticiones Individuales */}
                        <div className="border-t border-border-subtle pt-3">
                            <label className="label mb-2 block">Peticiones de Oferta Individuales</label>
                            <div className="space-y-2 mb-3">
                                {individualOffers.map((offer) => (
                                    <div key={offer.id} className="flex items-center justify-between text-sm bg-bg-glass p-2 rounded border border-border-subtle">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{offer.company}</span>
                                            <span className="text-xs text-text-muted">{offer.number}</span>
                                        </div>
                                        <button type="button" onClick={() => removeIndividualOffer(offer.id)} className="text-danger p-1">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Empresa"
                                    value={newOfferCompany}
                                    onChange={(e) => setNewOfferCompany(e.target.value)}
                                    className="flex-[2]"
                                />
                                <Input
                                    placeholder="Nº"
                                    value={newOfferNumber}
                                    onChange={(e) => setNewOfferNumber(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    onClick={addIndividualOffer}
                                    disabled={!newOfferCompany.trim()}
                                >
                                    <Plus size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Pedido y Adjudicación */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="col-span-1">
                            <label className="label">Pedido</label>
                            <Input
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 space-y-2 pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={adjudication}
                                    onChange={(e) => setAdjudication(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="text-sm">Adjudicación</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notification}
                                    onChange={(e) => setNotification(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="text-sm">Notificación</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 8. Aceptación / Recepción */}
                <div className="card p-3 border-border-subtle bg-bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                        <label className="label mb-0">Aceptación / Recepción</label>
                    </div>

                    <div className="space-y-2 mb-3">
                        {acceptanceDocs.length === 0 && (
                            <p className="text-xs text-text-muted italic">Sin documentos de aceptación</p>
                        )}
                        {acceptanceDocs.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-bg-glass p-2 rounded border border-border-subtle">
                                <span>{doc}</span>
                                <button type="button" onClick={() => removeAcceptanceDoc(i)} className="text-danger p-1">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Documento / Nota"
                            value={newAcceptanceDoc}
                            onChange={(e) => setNewAcceptanceDoc(e.target.value)}
                        />
                        <Button
                            type="button"
                            size="icon"
                            onClick={addAcceptanceDoc}
                            disabled={!newAcceptanceDoc.trim()}
                        >
                            <Plus size={18} />
                        </Button>
                    </div>
                </div>

                {/* 9. Factura y Notas */}
                <div>
                    <label className="label">Factura</label>
                    <Input
                        value={invoice}
                        onChange={(e) => setInvoice(e.target.value)}
                    />
                </div>
                <div>
                    <label className="label">Notas</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input w-full min-h-[80px] py-2 resize-none"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 sticky bottom-0 bg-bg-elevated/95 backdrop-blur-sm p-4 -mx-4 border-t border-border-subtle">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                        Guardar
                    </Button>
                </div>
            </form>
        </Sheet>
    )
}
