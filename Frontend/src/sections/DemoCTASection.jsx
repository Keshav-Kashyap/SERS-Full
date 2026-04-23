import { motion as Motion } from 'framer-motion'
import { FiPlay } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

function DemoCTASection() {
    const navigate = useNavigate()

    return (
        <section className="section-pad pb-24">
            <div className="container-shell text-center space-y-6">
                <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-semibold">
                        See SERS+ in action
                    </h2>
                    <p className="text-lg text-slate-600 max-w-lg mx-auto">
                        Experience how our AI detects risk, alerts drivers, and coordinates emergency response in real-time.
                    </p>
                </div>
                <Motion.button
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/demo')}
                    className="inline-flex items-center gap-3 rounded-2xl bg-ink px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-slate"
                >
                    <FiPlay />
                    Start Live Demo
                </Motion.button>
            </div>
        </section>
    )
}

export default DemoCTASection
