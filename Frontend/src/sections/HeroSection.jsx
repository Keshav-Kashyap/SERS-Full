import { motion as Motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

function HeroSection() {
    const navigate = useNavigate()

    return (
        <section className="section-pad">
            <div className="container-shell">
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="premium-card overflow-hidden px-6 py-16 sm:px-12"
                >
                    <p className="mx-auto mb-4 inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.16em] text-cyan">
                        AI Safety Intelligence
                    </p>
                    <h1 className="mx-auto max-w-4xl text-center text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                        Thousands of accidents happen every day.
                        <span className="block mt-3 bg-gradient-to-r from-cyan to-blue-400 bg-clip-text text-transparent">
                            What if we could predict them?
                        </span>
                    </h1>
                    <p className="mt-5 text-center text-xl font-medium text-slate-700">
                        Predict. Prevent. Respond.
                    </p>
                    <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-600 sm:text-lg">
                        SERS+ is an AI-powered system that predicts accident risk before it happens, alerts drivers in real-time, and automatically coordinates emergency response when seconds matter most.
                    </p>
                    <Motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => navigate('/demo')}
                        className="mx-auto mt-10 flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate"
                    >
                        Launch Demo
                        <FiArrowRight />
                    </Motion.button>
                </Motion.div>
            </div>
        </section>
    )
}

export default HeroSection
