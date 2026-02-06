import { Package, CheckSquare, ShoppingCart, Settings } from 'lucide-react'

export function WelcomePage() {
    return (
        <div className="page flex flex-col items-center justify-center p-6 text-center space-y-8 safe-top safe-bottom">
            <div className="space-y-4 max-w-xs mx-auto animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-accent/20 shadow-[0_0_30px_-10px_var(--accent)]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-12 h-12 text-accent"
                    >
                        <path d="M12 2v20" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                    Flow
                </h1>

                <p className="text-lg text-text-secondary font-medium leading-relaxed">
                    App personal de administración<br />de <span className="text-accent">Pablo</span> en la IM
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8 opacity-0 animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
                <div className="glass-card p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:bg-bg-elevated/50 transition-colors">
                    <CheckSquare size={24} className="mb-1 opacity-70" />
                    <span className="text-xs">Tareas</span>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:bg-bg-elevated/50 transition-colors">
                    <Package size={24} className="mb-1 opacity-70" />
                    <span className="text-xs">Inventario</span>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:bg-bg-elevated/50 transition-colors">
                    <ShoppingCart size={24} className="mb-1 opacity-70" />
                    <span className="text-xs">Compras</span>
                </div>
                <div className="glass-card p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:bg-bg-elevated/50 transition-colors">
                    <Settings size={24} className="mb-1 opacity-70" />
                    <span className="text-xs">Ajustes</span>
                </div>
            </div>
        </div>
    )
}
