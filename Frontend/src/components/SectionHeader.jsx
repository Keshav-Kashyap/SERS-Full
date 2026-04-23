function SectionHeader({ eyebrow, title, description, centered = false }) {
    return (
        <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
            {eyebrow ? (
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-cyan">
                    {eyebrow}
                </p>
            ) : null}
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
            {description ? (
                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                    {description}
                </p>
            ) : null}
        </div>
    )
}

export default SectionHeader
