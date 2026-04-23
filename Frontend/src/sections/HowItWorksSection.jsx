import { motion as Motion } from 'framer-motion'
import SectionHeader from '../components/SectionHeader'
import { howItWorksSteps } from '../data/mockData'

function HowItWorksSection() {
    return (
        <section className="section-pad">
            <div className="container-shell space-y-10">
                <SectionHeader
                    eyebrow="How It Works"
                    title="Three layers of safety: Predict, Prevent, Respond"
                    description="SERS+ operates in real-time, analyzing thousands of data points every second to keep you safe."
                />
                <Motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.12 } },
                    }}
                    className="grid gap-4 md:grid-cols-3"
                >
                    {howItWorksSteps.map((step, idx) => {
                        const Icon = step.icon
                        return (
                            <Motion.article
                                key={step.title}
                                variants={{
                                    hidden: { opacity: 0, y: 24 },
                                    show: { opacity: 1, y: 0 },
                                }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                                className="premium-card relative p-5"
                            >
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Step {idx + 1}
                                </p>
                                <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-mist p-3 text-xl text-cyan">
                                    <Icon />
                                </div>
                                <h3 className="text-lg font-semibold">{step.title}</h3>
                                <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
                            </Motion.article>
                        )
                    })}
                </Motion.div>
            </div>
        </section>
    )
}

export default HowItWorksSection
