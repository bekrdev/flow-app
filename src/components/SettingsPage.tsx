import { useRef } from 'react'
import { useStore } from '@/stores/store'
import { Button } from '@/components/ui/Button'
import { Download, Upload, Trash2, Info } from 'lucide-react'
import { downloadFile, readFile, haptic } from '@/lib/utils'
import { toast } from 'sonner'

export function SettingsPage() {
    const { items, tasks, purchases, exportData, importData } = useStore()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = () => {
        haptic('light')
        const data = exportData()
        const filename = `flow-backup-${new Date().toISOString().split('T')[0]}.json`
        downloadFile(filename, data, 'application/json')
        toast.success('Backup exportado')
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const content = await readFile(file)
            const data = JSON.parse(content)

            // Handle legacy format (old Invento with inventories)
            if (data.inventories && data.items) {
                // Check if items have inventoryId (legacy format)
                const hasLegacyItems = data.items.some((i: { inventoryId?: string }) => i.inventoryId)
                if (hasLegacyItems) {
                    importData({
                        inventories: data.inventories,
                        items_legacy: data.items,
                        tasks: data.tasks,
                        columns: data.columns,
                        purchases: data.purchases,
                    })
                } else {
                    importData(data)
                }
            } else {
                importData(data)
            }

            haptic('medium')
            toast.success('Datos importados correctamente')
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Error al importar. Verifica el archivo.')
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClearData = () => {
        if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
            if (confirm('¿Estás seguro? Se perderán todos los items, tareas y compras.')) {
                haptic('heavy')
                importData({ items: [], tasks: [], columns: [], purchases: [] })
                toast.success('Datos eliminados')
            }
        }
    }

    const stats = {
        items: items.length,
        tasks: tasks.length,
        purchases: purchases?.length || 0,
    }

    return (
        <div className="page safe-top">
            <div className="page-header">
                <h1 className="text-title mb-2">Ajustes</h1>
                <p className="text-text-secondary text-small">
                    Gestiona tus datos y preferencias
                </p>
            </div>

            <div className="page-content space-y-6">
                {/* Stats */}
                <div className="glass-card p-4">
                    <h2 className="text-heading mb-3 flex items-center gap-2">
                        <Info size={18} />
                        Resumen
                    </h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-accent">{stats.items}</div>
                            <div className="text-caption text-text-muted">Items</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-accent">{stats.tasks}</div>
                            <div className="text-caption text-text-muted">Tareas</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-accent">{stats.purchases}</div>
                            <div className="text-caption text-text-muted">Compras</div>
                        </div>
                    </div>
                </div>

                {/* Backup/Restore */}
                <div className="glass-card p-4">
                    <h2 className="text-heading mb-4">Copia de Seguridad</h2>
                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            className="w-full justify-center"
                        >
                            <Download size={18} />
                            Exportar Backup (JSON)
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={handleImportClick}
                            className="w-full justify-center"
                        >
                            <Upload size={18} />
                            Importar Backup
                        </Button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <p className="text-caption text-text-muted text-center">
                            Tus datos se guardan localmente en este dispositivo.
                            <br />
                            Exporta un backup para no perderlos.
                        </p>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="glass-card p-4 border-danger/30">
                    <h2 className="text-heading mb-4 text-danger">Zona de Peligro</h2>
                    <Button
                        variant="danger"
                        onClick={handleClearData}
                        className="w-full justify-center"
                    >
                        <Trash2 size={18} />
                        Borrar Todos los Datos
                    </Button>
                </div>

                {/* App Info */}
                <div className="text-center text-caption text-text-muted py-4">
                    <p>Flow v1.0.1</p>
                    <p className="mt-1">Developed by bekr</p>
                </div>
            </div>
        </div>
    )
}
