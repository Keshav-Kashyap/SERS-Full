import AnimatedContainer from '../components/AnimatedContainer'
import SectionHeader from '../components/SectionHeader'
import { aiFeatureCards } from '../data/mockData'

function AIFeaturesSection() {
    return (
        <section className="section-pad">
            <div className="container-shell space-y-10">
                <SectionHeader
                    eyebrow="AI Features"
                    title="Intelligence that learns and adapts"
                    description="Our AI doesn't just react—it predicts, learns from every incident, and gets smarter over time."
                />
                <div className="grid gap-5 md:grid-cols-3">
                    {aiFeatureCards.map((card, index) => {
                        const Icon = card.icon
                        return (
                            <AnimatedContainer key={card.title} delay={index * 0.08}>
                                <article className="premium-card h-full p-6">
                                    <div className="mb-5 inline-flex rounded-xl border border-cyan/20 bg-cyan/10 p-3 text-xl text-cyan">
                                        <Icon />
                                    </div>
                                    <h3 className="text-xl font-semibold">{card.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                        {card.description}
                                    </p>
                                </article>
                            </AnimatedContainer>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default AIFeaturesSection
