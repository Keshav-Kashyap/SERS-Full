import { FiCpu, FiClock, FiAlertCircle } from 'react-icons/fi'
import AnimatedContainer from '../components/AnimatedContainer'
import SectionHeader from '../components/SectionHeader'

const solutionItems = [
    {
        title: 'Predict',
        detail: 'AI identifies high-risk scenarios before they escalate. Machine learning models analyze driving patterns and environmental factors.',
        icon: FiCpu,
    },
    {
        title: 'Prevent',
        detail: 'Real-time warnings alert drivers to danger, enabling them to adjust speed, route, or behavior before an accident occurs.',
        icon: FiClock,
    },
    {
        title: 'Respond',
        detail: 'When accidents happen anyway, automatic emergency coordination activates—no delays, no manual steps, pure speed.',
        icon: FiAlertCircle,
    },
]

function SolutionSection() {
    return (
        <section className="section-pad">
            <div className="container-shell">
                <AnimatedContainer className="premium-card space-y-8 px-6 py-10 sm:px-10">
                    <SectionHeader
                        eyebrow="The Solution"
                        title="Predict → Prevent → Respond"
                        description="SERS+ shifts emergency systems from reaction to prevention. AI doesn't just respond to accidents—it stops them before they happen."
                    />
                    <div className="grid gap-6 md:grid-cols-3">
                        {solutionItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <article
                                    key={item.title}
                                    className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-mist p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-3 text-lg text-cyan">
                                        <Icon />
                                    </div>
                                    <h3 className="text-lg font-semibold">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                                </article>
                            )
                        })}
                    </div>
                </AnimatedContainer>
            </div>
        </section>
    )
}

export default SolutionSection
