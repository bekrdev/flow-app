import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import type { AppState, Item, Column } from '@/types'
import { generateId, now } from '@/lib/utils'

// ========================================
// IndexedDB Storage Adapter
// ========================================
const idbStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null

        // Try IndexedDB first
        const value = await get(name)
        if (value) return value

        // Migration: Check localStorage as fallback
        const localValue = localStorage.getItem(name)
        if (localValue) {
            console.log('[Invento] Migrating data from LocalStorage to IndexedDB...')
            await set(name, localValue)
            return localValue
        }

        return null
    },
    setItem: async (name: string, value: string) => {
        if (typeof window === 'undefined') return
        await set(name, value)
    },
    removeItem: async (name: string) => {
        if (typeof window === 'undefined') return
        await del(name)
    }
}

// ========================================
// Default Columns
// ========================================
const DEFAULT_COLUMNS: Column[] = [
    { id: 'todo', title: 'Pendiente', order: 0 },
    { id: 'in-progress', title: 'En Progreso', order: 1 },
    { id: 'done', title: 'Completado', order: 2 }
]

// ========================================
// Store
// ========================================
export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial State
            items: [],
            tasks: [],
            columns: DEFAULT_COLUMNS,
            purchases: [],

            // ========================================
            // Item Actions
            // ========================================
            addItem: (item) => set((state) => ({
                items: [
                    {
                        ...item,
                        minStockCritical: item.minStockCritical ?? 1,
                        id: generateId(),
                        createdAt: now(),
                        updatedAt: now()
                    },
                    ...state.items
                ]
            })),

            updateItem: (id, updates) => set((state) => ({
                items: state.items.map((i) =>
                    i.id === id ? { ...i, ...updates, updatedAt: now() } : i
                )
            })),

            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id)
            })),

            // ========================================
            // Task Actions
            // ========================================
            addTask: (task) => set((state) => {
                const columnTasks = state.tasks.filter(t => t.columnId === task.columnId)
                const maxOrder = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.order)) : -1
                return {
                    tasks: [
                        {
                            ...task,
                            id: generateId(),
                            order: maxOrder + 1,
                            createdAt: now(),
                            updatedAt: now()
                        },
                        ...state.tasks
                    ]
                }
            }),

            updateTask: (id, updates) => set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id ? { ...t, ...updates, updatedAt: now() } : t
                )
            })),

            removeTask: (id) => set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== id)
            })),

            moveTask: (taskId, newColumnId) => set((state) => {
                const task = state.tasks.find(t => t.id === taskId)
                if (!task) return state

                const newColumnTasks = state.tasks.filter(t => t.columnId === newColumnId)
                const maxOrder = newColumnTasks.length > 0 ? Math.max(...newColumnTasks.map(t => t.order)) : -1

                return {
                    tasks: state.tasks.map((t) =>
                        t.id === taskId
                            ? { ...t, columnId: newColumnId, order: maxOrder + 1, updatedAt: now() }
                            : t
                    )
                }
            }),

            reorderTasks: (newTasks) => set((state) => {
                const updates = new Map(newTasks.map(t => [t.id, t.order]))
                return {
                    tasks: state.tasks.map(t => {
                        if (updates.has(t.id)) {
                            return { ...t, order: updates.get(t.id)!, updatedAt: now() }
                        }
                        return t
                    })
                }
            }),

            // ========================================
            // Column Actions
            // ========================================
            addColumn: (column) => set((state) => ({
                columns: [...state.columns, column]
            })),

            updateColumn: (id, updates) => set((state) => ({
                columns: state.columns.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),

            removeColumn: (id) => set((state) => ({
                columns: state.columns.filter((c) => c.id !== id)
            })),

            // ========================================
            // Purchase Actions
            // ========================================
            addPurchase: (purchase) => set((state) => ({
                purchases: [
                    {
                        ...purchase,
                        id: generateId(),
                        createdAt: now(),
                        updatedAt: now()
                    },
                    ...(state.purchases || [])
                ]
            })),

            updatePurchase: (id, updates) => set((state) => ({
                purchases: state.purchases.map((p) =>
                    p.id === id ? { ...p, ...updates, updatedAt: now() } : p
                )
            })),

            removePurchase: (id) => set((state) => ({
                purchases: state.purchases.filter((p) => p.id !== id)
            })),

            // ========================================
            // Data Management
            // ========================================
            importData: (data) => {
                // Handle legacy format with inventories
                let importedItems: Item[] = data.items || []

                // Migration from old hierarchical format
                if (data.inventories && data.items_legacy) {
                    console.log('[Invento] Migrating from legacy hierarchical format...')
                    // Flatten old inventory items, using inventory name as category
                    const inventoryMap = new Map(data.inventories.map(inv => [inv.id, inv.name]))
                    importedItems = data.items_legacy.map((item: Record<string, unknown>) => ({
                        id: item.id as string || generateId(),
                        name: item.name as string || 'Item',
                        quantity: (item.quantity as number) || 0,
                        category: inventoryMap.get(item.inventoryId as string) || (item.category as string),
                        location: item.location as string,
                        minStockWarning: (item.minStockWarning as number) || undefined,
                        minStockCritical: (item.minStockCritical as number) || 1,
                        notes: item.notes as string,
                        createdAt: item.createdAt as string || now(),
                        updatedAt: item.updatedAt as string || now()
                    }))
                }

                set({
                    items: importedItems,
                    tasks: (data.tasks || []).map((t, idx) => ({
                        ...t,
                        order: t.order ?? idx
                    })),
                    columns: data.columns || DEFAULT_COLUMNS,
                    purchases: data.purchases || []
                })
            },

            exportData: () => {
                const state = get()
                return JSON.stringify({
                    items: state.items,
                    tasks: state.tasks,
                    columns: state.columns,
                    purchases: state.purchases,
                    exportedAt: now(),
                    version: '2.0'
                }, null, 2)
            }
        }),
        {
            name: 'flow-storage-v2',
            storage: createJSONStorage(() => idbStorage),
            version: 1,
            migrate: (persistedState, version) => {
                const state = persistedState as AppState
                if (version === 0) {
                    return {
                        ...state,
                        items: state.items || [],
                        purchases: state.purchases || [],
                        tasks: state.tasks || [],
                        columns: state.columns || DEFAULT_COLUMNS
                    }
                }
                return state
            }
        }
    )
)
