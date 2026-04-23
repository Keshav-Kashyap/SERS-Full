import { motion as Motion } from 'framer-motion'

function AnimatedContainer({ children, delay = 0, className = '' }) {
    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </Motion.div>
    )
}

export default AnimatedContainer
