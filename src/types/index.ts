// ========================================
// INVENTO v2 - Type Definitions
// Simplified, flat architecture
// ========================================

/** Single item in the global inventory */
export interface Item {
    id: string
    name: string
    quantity: number
    category?: string
    location?: string
    notes?: string
    createdAt: string
    updatedAt: string
}

/** Task status - flexible to support custom columns */
export type TaskStatus = 'todo' | 'in-progress' | 'done' | string

/** Task for the Kanban board */
export interface Task {
    id: string
    columnId: string
    title: string
    description?: string
    color?: string // hex
    order: number
    createdAt: string
    updatedAt: string
}

/** Kanban column */
export interface Column {
    id: string
    title: string
    order: number
}

/** Purchase type */
export type PurchaseType = 'direct' | 'warehouse'

/** Individual offer for purchases */
export interface IndividualOffer {
    id: string
    company: string
    number: string
}

/** Purchase tracking for SAP workflow */
export interface Purchase {
    id: string
    type: PurchaseType
    description: string
    notes?: string
    amount?: number
    currency?: 'UYU' | 'USD'

    // Core Process Fields
    requestNumber?: string
    category?: 'product' | 'service'
    unitPrice?: number
    quantity?: number
    investmentOrder?: string

    // Booleans / Checklists
    fundsStatus?: boolean
    liberationA?: boolean
    liberationB?: boolean

    // Direct Purchase Specifics
    offerRequest?: string
    offerReceptionDate?: string
    individualOfferRequests?: IndividualOffer[]
    technicalStudy?: boolean
    sentToUCP?: boolean
    orderNumber?: string
    adjudication?: boolean
    notification?: boolean
    serviceSheets?: string[]
    acceptanceDocs?: string[]
    reception?: boolean
    invoice?: string

    createdAt: string
    updatedAt: string
}

/** Complete app state shape */
export interface AppState {
    // Data
    items: Item[]
    tasks: Task[]
    columns: Column[]
    purchases: Purchase[]

    // Item Actions
    addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void
    updateItem: (id: string, updates: Partial<Item>) => void
    removeItem: (id: string) => void

    // Task Actions
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void
    updateTask: (id: string, updates: Partial<Task>) => void
    removeTask: (id: string) => void
    moveTask: (taskId: string, newColumnId: string) => void
    reorderTasks: (tasks: Task[]) => void

    // Column Actions
    addColumn: (column: Column) => void
    updateColumn: (id: string, updates: Partial<Column>) => void
    removeColumn: (id: string) => void

    // Purchase Actions
    addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => void
    updatePurchase: (id: string, updates: Partial<Purchase>) => void
    removePurchase: (id: string) => void

    // Data Management
    importData: (data: {
        items?: Item[]
        tasks?: Task[]
        columns?: Column[]
        purchases?: Purchase[]
        // Legacy support
        inventories?: Array<{ id: string; name: string }>
        items_legacy?: Array<{ inventoryId: string;[key: string]: unknown }>
    }) => void
    exportData: () => string
}

/** View mode for lists */
export type ViewMode = 'list' | 'grid'

/** Filter state */
export interface FilterState {
    search: string
    category: string | null
    location: string | null
}
