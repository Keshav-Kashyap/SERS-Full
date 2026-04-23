import { motion as Motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'

function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const isDemo = location.pathname === '/demo'
    const isMap = location.pathname === '/map'

    return (
        <Motion.header
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95"
        >
            <div className="container-shell flex items-center justify-between py-4">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="font-display text-lg font-semibold tracking-tight text-ink"
                >
                    SERS+
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(isMap ? '/' : '/map')}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan hover:text-cyan"
                    >
                        {isMap ? 'Back to Home' : 'Live Map'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(isDemo ? '/' : '/demo')}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan hover:text-cyan"
                    >
                        {isDemo ? 'Back to Home' : 'Launch Demo'}
                    </button>
                </div>
            </div>
        </Motion.header>
    )
}

export default Navbar
