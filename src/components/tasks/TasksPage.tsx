import { useState, useMemo } from 'react'
import { Plus, Download, GripVertical, Trash2, Edit2 } from 'lucide-react'
import { useStore } from '@/stores/store'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskSheet } from './TaskSheet'
import { haptic } from '@/lib/utils'
import { toast } from 'sonner'
import type { Task } from '@/types'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    pointerWithin,
    rectIntersection,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    type CollisionDetection,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Custom collision detection - prefer columns over tasks for cross-column moves
const customCollisionDetection: CollisionDetection = (args) => {
    // First, check if we're over any droppable columns
    const pointerCollisions = pointerWithin(args)

    // If we found collisions with pointerWithin, prioritize column IDs
    if (pointerCollisions.length > 0) {
        // Sort to prioritize column containers
        const columnIds = ['todo', 'in-progress', 'done']
        const columnCollision = pointerCollisions.find(c =>
            columnIds.includes(c.id as string)
        )
        if (columnCollision) {
            return [columnCollision]
        }
        return pointerCollisions
    }

    // Fallback to rect intersection
    return rectIntersection(args)
}

// CSV Export helper
function exportTasksToCSV(tasks: Task[], columns: { id: string; title: string }[]) {
    const BOM = '\ufeff'
    const header = ['Título', 'Descripción', 'Estado', 'Color', 'Creada'].join(',')

    const rows = tasks.map(task => {
        const columnName = columns.find(c => c.id === task.columnId)?.title || 'Sin estado'
        return [
            `"${(task.title || '').replace(/"/g, '""')}"`,
            `"${(task.description || '').replace(/"/g, '""')}"`,
            `"${columnName}"`,
            `"${task.color || ''}"`,
            `"${new Date(task.createdAt).toLocaleDateString('es-UY')}"`,
        ].join(',')
    })

    const csv = BOM + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `flow-tareas-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

export function TasksPage() {
    const { tasks, columns, moveTask, removeTask, reorderTasks } = useStore()
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    // Sort columns
    const sortedColumns = useMemo(
        () => [...columns].sort((a, b) => a.order - b.order),
        [columns]
    )

    // Group tasks by column
    const tasksByColumn = useMemo(() => {
        const map: Record<string, Task[]> = {}
        sortedColumns.forEach(col => {
            map[col.id] = tasks
                .filter(t => t.columnId === col.id)
                .sort((a, b) => a.order - b.order)
        })
        return map
    }, [tasks, sortedColumns])

    // Sensors for drag and drop - reduce delay for better responsiveness
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t.id === event.active.id)
        if (task) {
            setActiveTask(task)
            haptic('light')
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string
        if (activeId === overId) return

        const activeTaskData = tasks.find(t => t.id === activeId)
        if (!activeTaskData) return

        // Determine target column
        let targetColumnId: string | null = null

        // Check if overId is a column ID
        if (sortedColumns.find(c => c.id === overId)) {
            targetColumnId = overId
        } else {
            // Check if it's a task and get that task's column
            const overTask = tasks.find(t => t.id === overId)
            if (overTask) {
                targetColumnId = overTask.columnId
            }
        }

        // Move task to new column if different
        if (targetColumnId && activeTaskData.columnId !== targetColumnId) {
            moveTask(activeId, targetColumnId)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string
        if (activeId === overId) return

        const activeTaskData = tasks.find(t => t.id === activeId)
        const overTaskData = tasks.find(t => t.id === overId)

        // Reorder within same column
        if (activeTaskData && overTaskData && activeTaskData.columnId === overTaskData.columnId) {
            const colTasks = tasksByColumn[activeTaskData.columnId] || []
            const activeIndex = colTasks.findIndex(t => t.id === activeId)
            const overIndex = colTasks.findIndex(t => t.id === overId)

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                const reordered = arrayMove(colTasks, activeIndex, overIndex)
                const updates = reordered.map((t, idx) => ({ ...t, order: idx }))
                reorderTasks(updates)
                haptic('medium')
            }
        }
    }

    const handleAdd = () => {
        setEditingTask(null)
        setSheetOpen(true)
    }

    const handleEdit = (task: Task) => {
        setEditingTask(task)
        setSheetOpen(true)
    }

    const handleDelete = (task: Task) => {
        if (confirm(`¿Eliminar "${task.title}"?`)) {
            haptic('medium')
            removeTask(task.id)
            toast.success('Tarea eliminada')
        }
    }

    const handleExport = () => {
        exportTasksToCSV(tasks, columns)
        haptic('light')
        toast.success('Tareas exportadas a CSV')
    }

    return (
        <div className="page safe-top">
            {/* Header */}
            <header className="page-header">
                <div className="flex items-center justify-between">
                    <h1 className="text-title">Tareas</h1>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleExport}>
                            <Download size={16} />
                            <span className="hidden sm:inline">CSV</span>
                        </Button>
                        <Button size="sm" onClick={handleAdd}>
                            <Plus size={18} />
                            <span className="hidden sm:inline">Nueva</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="kanban-wrapper">
                <DndContext
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="kanban-board">
                        {sortedColumns.map(column => (
                            <DroppableColumn
                                key={column.id}
                                id={column.id}
                                title={column.title}
                                tasks={tasksByColumn[column.id] || []}
                                onEditTask={handleEdit}
                                onDeleteTask={handleDelete}
                                onAddTask={handleAdd}
                            />
                        ))}
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeTask && <TaskCard task={activeTask} isDragging />}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Empty State */}
            {tasks.length === 0 && (
                <EmptyState
                    title="Sin tareas"
                    description="Organiza tu trabajo con un tablero Kanban"
                    action={
                        <Button onClick={handleAdd}>
                            <Plus size={18} />
                            Nueva Tarea
                        </Button>
                    }
                />
            )}

            {/* Task Sheet */}
            <TaskSheet
                open={sheetOpen}
                onClose={() => {
                    setSheetOpen(false)
                    setEditingTask(null)
                }}
                task={editingTask}
                columnId={sortedColumns[0]?.id || 'todo'}
            />
        </div>
    )
}

// Droppable Column Component
function DroppableColumn({
    id,
    title,
    tasks,
    onEditTask,
    onDeleteTask,
    onAddTask,
}: {
    id: string
    title: string
    tasks: Task[]
    onEditTask: (task: Task) => void
    onDeleteTask: (task: Task) => void
    onAddTask: () => void
}) {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}
        >
            {/* Column Header */}
            <div className="kanban-column-header">
                <h3 className="kanban-column-title">{title}</h3>
                <span className="kanban-column-count">{tasks.length}</span>
            </div>

            {/* Tasks */}
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="kanban-column-content">
                    {tasks.map(task => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onEdit={() => onEditTask(task)}
                            onDelete={() => onDeleteTask(task)}
                        />
                    ))}
                </div>
            </SortableContext>

            {/* Add Task Button */}
            <button className="kanban-add-task" onClick={onAddTask}>
                <Plus size={16} />
                Agregar
            </button>
        </div>
    )
}

// Sortable Task Card wrapper
function SortableTaskCard({
    task,
    onEdit,
    onDelete,
}: {
    task: Task
    onEdit: () => void
    onDelete: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    return (
        <div ref={setNodeRef} style={style}>
            <TaskCard
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    )
}

// Task Card Component
function TaskCard({
    task,
    onEdit,
    onDelete,
    isDragging,
    dragHandleProps,
}: {
    task: Task
    onEdit?: () => void
    onDelete?: () => void
    isDragging?: boolean
    dragHandleProps?: Record<string, unknown>
}) {
    return (
        <div
            className={`kanban-task ${isDragging ? 'kanban-task-dragging' : ''}`}
            style={task.color ? { borderLeftColor: task.color } : undefined}
        >
            {/* Drag Handle */}
            <div {...dragHandleProps} className="kanban-task-handle">
                <GripVertical size={14} />
            </div>

            {/* Content */}
            <div className="kanban-task-content">
                <div className="kanban-task-title">{task.title}</div>
                {task.description && (
                    <div className="kanban-task-desc">{task.description}</div>
                )}
            </div>

            {/* Actions */}
            {(onEdit || onDelete) && (
                <div className="kanban-task-actions">
                    {onEdit && (
                        <button onClick={onEdit} className="kanban-action-btn" aria-label="Editar">
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={onDelete} className="kanban-action-btn kanban-action-delete" aria-label="Eliminar">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
