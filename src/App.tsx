import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TabBar } from '@/components/ui/TabBar'
import { InventoryPage } from '@/components/inventory/InventoryPage'
import { TasksPage } from '@/components/tasks/TasksPage'
import { PurchasesPage } from '@/components/purchases/PurchasesPage'
import { SettingsPage } from '@/components/SettingsPage'
import { WelcomePage } from '@/components/WelcomePage'

export default function App() {
    return (
        <div className="min-h-screen min-h-dvh flex flex-col bg-background">
            {/* Main Content */}
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>

            {/* Bottom Tab Navigation */}
            <TabBar />

            {/* Toast Notifications */}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                    },
                }}
            />
        </div>
    )
}
