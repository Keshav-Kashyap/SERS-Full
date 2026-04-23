import { motion as Motion } from 'framer-motion'

function ImpactSection() {
    return (
        <section className="section-pad">
            <div className="container-shell">
                <Motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="rounded-3xl bg-impact-gradient px-6 py-16 text-center shadow-lg sm:px-12"
                >
                    <p className="mx-auto mb-8 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
                        Our Mission
                    </p>
                    <p className="mx-auto max-w-4xl text-2xl font-semibold leading-relaxed text-white sm:text-3xl lg:text-4xl">
                        We may not prevent every accident, but even if we prevent one out of a hundred and save a single life, our system is successful.
                    </p>
                    <p className="mx-auto mt-6 max-w-2xl text-base text-white/80">
                        That's 100+ lives saved every day. That's our impact.
                    </p>
                </Motion.div>
            </div>
        </section>
    )
}

export default ImpactSection
