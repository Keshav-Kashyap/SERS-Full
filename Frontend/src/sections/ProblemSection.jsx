import AnimatedContainer from '../components/AnimatedContainer'
import SectionHeader from '../components/SectionHeader'
import { problemPoints } from '../data/mockData'

function ProblemSection() {
    return (
        <section className="section-pad">
            <div className="container-shell space-y-10">
                <SectionHeader
                    eyebrow="The Problem"
                    title="Current systems only react—they never predict"
                    description="Accidents aren't random. Yet today's technology waits for crashes to happen, wasting critical response time."
                />
                <div className="grid gap-5 md:grid-cols-3">
                    {problemPoints.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <AnimatedContainer key={item.title} delay={index * 0.08}>
                                <article className="premium-card h-full p-6">
                                    <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-mist p-3 text-xl text-cyan">
                                        <Icon />
                                    </div>
                                    <h3 className="text-xl font-semibold">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.text}</p>
                                </article>
                            </AnimatedContainer>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default ProblemSection
