import { FiCheckCircle } from 'react-icons/fi'
import AnimatedContainer from '../components/AnimatedContainer'
import SectionHeader from '../components/SectionHeader'
import { systemFeatures } from '../data/mockData'

function CoreFeaturesSection() {
    return (
        <section className="section-pad">
            <div className="container-shell space-y-10">
                <SectionHeader
                    eyebrow="System Features"
                    title="Built for reliability under pressure"
                    description="Every feature designed with one goal: save lives when seconds matter."
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {systemFeatures.map((feature, index) => (
                        <AnimatedContainer key={feature} delay={index * 0.06}>
                            <article className="premium-card flex items-center gap-3 p-5">
                                <span className="inline-flex rounded-full bg-cyan/10 p-2 text-cyan">
                                    <FiCheckCircle />
                                </span>
                                <p className="text-sm font-semibold text-slate-700 sm:text-base">{feature}</p>
                            </article>
                        </AnimatedContainer>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default CoreFeaturesSection
