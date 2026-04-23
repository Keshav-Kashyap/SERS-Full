import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom'

// ── CSS Variables injected via style tag ──
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  :root {
    --bg: #fafaf8; --surface: #f4f3ef; --card: #ffffff;
    --border: rgba(0,0,0,0.07); --border-mid: rgba(0,0,0,0.12);
    --ink: #111110; --ink2: #3a3935; --muted: #8a8880; --muted2: #6b6a67;
    --red: #d63a1e; --red-soft: #fff0ed; --red-border: rgba(214,58,30,0.18);
    --blue: #1a5cf6; --blue-soft: #eff3ff; --blue-border: rgba(26,92,246,0.15);
    --green: #1a8a4a; --green-soft: #edfaf2; --green-border: rgba(26,138,74,0.15);
    --amber: #b45309; --amber-soft: #fffbeb;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  .fraunces { font-family: 'Fraunces', serif; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.45; transform:scale(0.85); } }
  .pulse { animation: pulse 1.8s ease infinite; }
  .pulse-fast { animation: pulse 1.5s ease infinite; }
`;

// ── Reusable motion variants ──
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay } }),
};

const fadeDown = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const staggerItem = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

// ── Scroll-reveal wrapper ──
function Reveal({ children, delay = 0, className = "" }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"}
            variants={fadeUp} custom={delay} className={className}>
            {children}
        </motion.div>
    );
}

// ── Shield icon ──
const ShieldIcon = ({ size = 16, color = "white", checkColor = "#d63a1e" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1L2 3.5V8.5C2 11.5 5 13.8 8 15C11 13.8 14 11.5 14 8.5V3.5L8 1Z" fill={color} opacity="0.9" />
        <path d="M5.5 8L7.2 9.8L10.5 6.5" stroke={checkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ── NAV ──
function Nav() {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate()
    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    return (
        <motion.nav initial="hidden" animate="visible" variants={fadeDown}
            style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 60px", height: 64,
                background: scrolled ? "rgba(250,250,248,0.95)" : "rgba(250,250,248,0.88)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.3s",
            }}>
            <div className="fraunces" style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, background: "var(--red)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldIcon />
                </div>
                SERS<span style={{ color: "var(--red)" }}>+</span>
            </div>
            <ul style={{ display: "flex", alignItems: "center", gap: 32, listStyle: "none", fontSize: "0.84rem", fontWeight: 500, color: "var(--muted2)" }}>
                {["problem", "how", "features", "solution"].map(id => (
                    <li key={id}><a href={`#${id}`} style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => e.target.style.color = "var(--ink)"}
                        onMouseLeave={e => e.target.style.color = "var(--muted2)"}>
                        {id.charAt(0).toUpperCase() + id.slice(1)}
                    </a></li>
                ))}
            </ul>
            <motion.button
                type="button"
                onClick={() => navigate('/demo')}
                whileHover={{ opacity: 0.85, y: -1 }}
                style={{
                fontSize: "0.82rem", fontWeight: 600, color: "#fff", background: "var(--ink)",
                padding: "9px 20px", borderRadius: 8, textDecoration: "none", letterSpacing: "0.01em",
            }}>
                See Demo
            </motion.button>
        </motion.nav>
    );
}

// ── HERO ──
function Hero() {
    return (
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 40px 80px", position: "relative", background: "var(--bg)", overflow: "hidden" }}>
            {/* Grid BG */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%)" }} />
            {/* Blobs */}
            <div style={{ position: "absolute", width: 500, height: 500, background: "rgba(214,58,30,0.07)", top: -80, right: -80, borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 400, height: 400, background: "rgba(26,92,246,0.06)", bottom: -60, left: -60, borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />

            {/* Eyebrow
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--red)", border: "1px solid var(--red-border)", background: "var(--red-soft)", padding: "6px 14px", borderRadius: 100, marginBottom: 36 }}>
                <span className="pulse" style={{ width: 5, height: 5, background: "var(--red)", borderRadius: "50%", display: "inline-block" }} />
                AI-Powered · Real-Time · Predictive
            </motion.div> */}

            {/* App Name */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.2}
                className="fraunces" style={{ fontSize: "clamp(3.5rem, 9vw, 7rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em", position: "relative", zIndex: 1, marginBottom: 8 }}>
                SERS<sup style={{ fontSize: "0.4em", verticalAlign: "super", color: "var(--red)", fontWeight: 300 }}>+</sup>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.3}
                style={{ fontSize: "clamp(0.85rem, 1.8vw, 1rem)", fontWeight: 400, color: "var(--muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 48, position: "relative", zIndex: 1 }}>
                AI Accident Predictor &amp; Emergency Response
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0.35}
                className="fraunces" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)", fontWeight: 300, lineHeight: 1.45, letterSpacing: "-0.02em", color: "var(--ink2)", maxWidth: 680, margin: "0 auto 20px", position: "relative", zIndex: 1 }}>
                Thousands of accidents happen daily.<br />
                <em style={{ fontStyle: "italic", color: "var(--red)" }}>What if we could predict them first?</em>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0.45}
                style={{ fontSize: "0.95rem", color: "var(--muted)", maxWidth: 460, margin: "0 auto 48px", lineHeight: 1.75, position: "relative", zIndex: 1 }}>
                SERS+ analyzes risk before it becomes reality — using behavioral AI, live sensor data, and predictive intelligence to protect lives at scale.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.55}
                style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
                <motion.a href="#how" whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(214,58,30,0.35)" }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.88rem", fontWeight: 600, color: "#fff", background: "var(--red)", padding: "13px 28px", borderRadius: 10, textDecoration: "none", boxShadow: "0 2px 16px rgba(214,58,30,0.25)", transition: "box-shadow 0.22s" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="4,2 12,7 4,12" fill="white" /></svg>
                    See How It Works
                </motion.a>
                <motion.a href="#solution" whileHover={{ borderColor: "var(--ink)", background: "var(--surface)" }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.88rem", fontWeight: 500, color: "var(--ink2)", background: "var(--card)", padding: "13px 24px", borderRadius: 10, border: "1px solid var(--border-mid)", textDecoration: "none", transition: "all 0.22s" }}>
                    Explore the System
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 6.5H10M7 3.5L10 6.5L7 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </motion.a>
            </motion.div>
        </section>
    );
}

// ── STATS BAR ──
const stats = [
    { num: "1.35M", label: "Road Deaths Per Year", color: "#ff7a5c" },
    { num: "94%", label: "Human-Behavioural Cause", color: "#fff" },
    { num: "8 min", label: "Avg Emergency Delay", color: "#ff7a5c" },
    { num: "↑ 60%", label: "Survival with Early Response", color: "#5ce8a0" },
];

function StatsBar() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}
            style={{ background: "var(--ink)", padding: "36px 60px", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            {stats.map((s, i) => (
                <motion.div key={i} variants={staggerItem}
                    style={{ textAlign: "center", padding: "0 52px", borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                    <div className="fraunces" style={{ fontSize: "2.2rem", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, color: s.color }}>{s.num}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 500, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 7 }}>{s.label}</div>
                </motion.div>
            ))}
        </motion.div>
    );
}

// ── PROBLEM ──
const probCards = [
    {
        bg: "var(--red-soft)", icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3L18 17H2L10 3Z" stroke="#d63a1e" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M10 9V12" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="14.5" r="0.75" fill="#d63a1e" />
            </svg>
        ), title: "No Prediction Layer", text: "Existing systems detect accidents only after impact. No proactive risk assessment or behavioral monitoring exists in real time."
    },
    {
        bg: "var(--amber-soft)", icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="#b45309" strokeWidth="1.5" />
                <path d="M10 6.5V10.5L13 12.5" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ), title: "Delayed Emergency Response", text: "Manual reporting creates 8–12 minute gaps before help is dispatched. In trauma, every second determines survival."
    },
    {
        bg: "var(--blue-soft)", icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="3" width="5" height="5" rx="1.5" stroke="#1a5cf6" strokeWidth="1.4" />
                <rect x="13" y="3" width="5" height="5" rx="1.5" stroke="#1a5cf6" strokeWidth="1.4" />
                <rect x="7.5" y="12" width="5" height="5" rx="1.5" stroke="#1a5cf6" strokeWidth="1.4" />
                <path d="M4.5 8L10 12M15.5 8L10 12" stroke="#1a5cf6" strokeWidth="1.2" strokeDasharray="2 2" />
            </svg>
        ), title: "Fragmented Data Silos", text: "Traffic cameras, sensors, and emergency systems work in isolation. No unified intelligence connects the dots in real time."
    },
];

function Problem() {
    return (
        <section id="problem" style={{ background: "var(--surface)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "100px 40px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 1, background: "var(--border-mid)", display: "inline-block" }} />The Problem
                </div>
                <h2 className="fraunces" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                    We react to accidents.<br />We never <span style={{ color: "var(--red)" }}>predict</span> them.
                </h2>
                <Reveal>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start", marginTop: 56 }}>
                        <div>
                            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--ink2)", marginBottom: 18 }}>Current road safety systems are fundamentally <strong>reactive</strong>. Emergency teams are alerted only after a collision — by which point, critical minutes have already been lost.</p>
                            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--ink2)", marginBottom: 18 }}>There's no intelligence watching the road <strong>before</strong> the crash. No system analyzing behavioral patterns in real time. No early warning. Just silence — and then sirens.</p>
                            <div style={{ marginTop: 32, padding: "24px 28px", borderLeft: "3px solid var(--red)", background: "var(--red-soft)", borderRadius: "0 10px 10px 0" }}>
                                <p className="fraunces" style={{ fontSize: "1.05rem", fontStyle: "italic", color: "var(--red)", lineHeight: 1.6, fontWeight: 300 }}>
                                    "In 8 out of 10 accidents, the warning signs were there. Nobody was watching."
                                </p>
                            </div>
                        </div>
                        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: "grid", gap: 14 }}>
                            {probCards.map((c, i) => (
                                <motion.div key={i} variants={staggerItem}
                                    whileHover={{ y: -2, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}
                                    style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px", display: "flex", gap: 16, alignItems: "flex-start", transition: "box-shadow 0.25s" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
                                    <div>
                                        <h4 className="fraunces" style={{ fontSize: "0.98rem", fontWeight: 500, marginBottom: 5 }}>{c.title}</h4>
                                        <p style={{ fontSize: "0.83rem", color: "var(--muted)", lineHeight: 1.66 }}>{c.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ── HOW IT WORKS ──
const steps = [
    {
        num: "Step 01", numColor: "var(--blue)", iconBg: "var(--blue-soft)", iconBorder: "var(--blue-border)", titleColor: "var(--blue)", title: "Predict",
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1a5cf6" strokeWidth="1.5" strokeDasharray="3 3" /><circle cx="12" cy="12" r="5" stroke="#1a5cf6" strokeWidth="1.5" /><circle cx="12" cy="12" r="2" fill="#1a5cf6" /><path d="M12 3V12" stroke="#1a5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" /></svg>),
        text: "AI models analyze live sensor data, traffic density, driver behavior, weather, and historical accident zones to generate a real-time risk score — before anything goes wrong."
    },
    {
        num: "Step 02", numColor: "var(--green)", iconBg: "var(--green-soft)", iconBorder: "var(--green-border)", titleColor: "var(--green)", title: "Prevent",
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 6.5V12C4 16 8 19.2 12 21C16 19.2 20 16 20 12V6.5L12 3Z" stroke="#1a8a4a" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 12L11.2 14.5L15 9.5" stroke="#1a8a4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>),
        text: "When risk thresholds are crossed, the system issues proactive alerts to drivers, traffic management, and connected infrastructure — stopping accidents before they happen."
    },
    {
        num: "Step 03", numColor: "var(--red)", iconBg: "var(--red-soft)", iconBorder: "var(--red-border)", titleColor: "var(--red)", title: "Respond",
        icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="5" stroke="#d63a1e" strokeWidth="1.5" /><path d="M12 8V6" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" /><path d="M8.5 9.5L7.1 8.1" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" /><path d="M15.5 9.5L16.9 8.1" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" /><path d="M5 13H3" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" /><path d="M21 13H19" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" /><path d="M9 19H15" stroke="#d63a1e" strokeWidth="1.5" strokeLinecap="round" /></svg>),
        text: "If an incident occurs, SERS+ auto-dispatches emergency services with pinpoint GPS, severity data, and medical context — cutting response time by up to 70%."
    },
];

function HowItWorks() {
    return (
        <section id="how" style={{ background: "var(--bg)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "100px 40px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 1, background: "var(--border-mid)", display: "inline-block" }} />Methodology
                </div>
                <h2 className="fraunces" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                    Three steps. <em style={{ fontStyle: "italic", color: "var(--blue)" }}>One mission.</em>
                </h2>
                <p style={{ color: "var(--muted)", maxWidth: 480, marginTop: 10, fontSize: "0.93rem", lineHeight: 1.75 }}>
                    From data to decision in milliseconds — a continuous intelligence loop that watches, warns, and acts.
                </p>
                <Reveal>
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 56, border: "1px solid var(--border-mid)", borderRadius: 18, overflow: "hidden" }}>
                        {steps.map((s, i) => (
                            <motion.div key={i} variants={staggerItem}
                                whileHover={{ background: "var(--surface)" }}
                                style={{ padding: "44px 36px", borderRight: i < steps.length - 1 ? "1px solid var(--border)" : "none", position: "relative", background: "var(--card)", transition: "background 0.25s" }}>
                                <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 20, color: s.numColor }}>{s.num}</div>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: s.iconBg, border: `1px solid ${s.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{s.icon}</div>
                                <h3 className="fraunces" style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 12, color: s.titleColor }}>{s.title}</h3>
                                <p style={{ fontSize: "0.87rem", color: "var(--muted2)", lineHeight: 1.75 }}>{s.text}</p>
                                {i < steps.length - 1 && (
                                    <div style={{ position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, background: "var(--card)", border: "1px solid var(--border-mid)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6H9M6.5 3.5L9 6L6.5 8.5" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </Reveal>
            </div>
        </section>
    );
}

// ── DASHBOARD MOCKUP ──
function Dashboard() {
    const risks = [
        { zone: "NH-48 Flyover Zone", val: "HIGH · 78%", valColor: "var(--red)", fillW: "78%", fillGrad: "linear-gradient(90deg, #d63a1e, #ff7a5c)" },
        { zone: "Ring Road Bypass", val: "MEDIUM · 51%", valColor: "var(--amber)", fillW: "51%", fillGrad: "linear-gradient(90deg, #b45309, #f59e0b)" },
        { zone: "School Zone Corridor", val: "LOW · 23%", valColor: "var(--green)", fillW: "23%", fillGrad: "linear-gradient(90deg, #1a8a4a, #34d36f)" },
    ];
    return (
        <div style={{ background: "var(--card)", border: "1px solid var(--border-mid)", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}>
            <div style={{ padding: "14px 20px", background: "var(--ink)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", flex: 1, textAlign: "center" }}>SERS+ Live Risk Monitor · Sector 7-A</div>
            </div>
            <div style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                    <span className="pulse-fast" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--green)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live · Updating</span>
                </div>
                <div style={{ display: "grid", gap: 14, marginBottom: 22 }}>
                    {risks.map((r, i) => (
                        <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                                <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--ink2)" }}>{r.zone}</span>
                                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: r.valColor }}>{r.val}</span>
                            </div>
                            <div style={{ height: 5, background: "var(--surface)", borderRadius: 100, overflow: "hidden" }}>
                                <motion.div initial={{ width: 0 }} whileInView={{ width: r.fillW }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ height: "100%", borderRadius: 100, background: r.fillGrad }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Active Alerts</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {[
                            { label: "Collision Risk · NH-48", cls: { bg: "var(--red-soft)", color: "var(--red)", border: "var(--red-border)" } },
                            { label: "Wet Road Detected", cls: { bg: "var(--blue-soft)", color: "var(--blue)", border: "var(--blue-border)" } },
                            { label: "Erratic Driver · Lane 3", cls: { bg: "var(--red-soft)", color: "var(--red)", border: "var(--red-border)" } },
                            { label: "Units Dispatched", cls: { bg: "var(--green-soft)", color: "var(--green)", border: "var(--green-border)" } },
                        ].map((ch, i) => (
                            <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                style={{ fontSize: "0.72rem", fontWeight: 600, padding: "4px 11px", borderRadius: 100, background: ch.cls.bg, color: ch.cls.color, border: `1px solid ${ch.cls.border}` }}>
                                {ch.label}
                            </motion.span>
                        ))}
                    </div>
                </div>
                <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 18 }}>
                    {[{ num: "2.1s", label: "Alert Latency", color: "var(--blue)" }, { num: "94.7%", label: "Accuracy", color: "var(--green)" }, { num: "3 Live", label: "Incidents", color: "var(--red)" }].map((ds, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center", padding: "16px 12px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                            <div className="fraunces" style={{ fontSize: "1.4rem", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1, color: ds.color }}>{ds.num}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{ds.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── SOLUTION ──
const solFeats = [
    { title: "Real-Time Risk Scoring", text: "Continuous analysis of 50+ data inputs per second — speed, lane position, road conditions, density — producing a live danger index." },
    { title: "Predictive Alerts", text: "Warnings pushed to drivers and traffic systems seconds before a high-risk situation escalates into a collision." },
    { title: "Autonomous Emergency Dispatch", text: "No human relay needed. SERS+ directly contacts police, ambulance, and fire with location, severity, and suggested approach route." },
    { title: "Dynamic Hazard Mapping", text: "Self-updating accident heatmaps that adapt in real time — redirecting traffic and flagging high-risk zones city-wide." },
];

function Solution() {
    return (
        <section id="solution" style={{ background: "var(--surface)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "100px 40px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 1, background: "var(--border-mid)", display: "inline-block" }} />The Solution
                </div>
                <h2 className="fraunces" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                    AI that <em style={{ fontStyle: "italic", color: "var(--blue)" }}>sees the future</em><br />of every vehicle.
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", marginTop: 56 }}>
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: "grid", gap: 16 }}>
                        {solFeats.map((f, i) => (
                            <motion.div key={i} variants={staggerItem}
                                whileHover={{ borderColor: "var(--blue-border)", boxShadow: "0 2px 16px rgba(26,92,246,0.07)" }}
                                style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "20px 22px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, transition: "all 0.25s" }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--blue-soft)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="#1a5cf6" strokeWidth="1.3" strokeDasharray="2 2" /><circle cx="9" cy="9" r="3" stroke="#1a5cf6" strokeWidth="1.3" /><circle cx="9" cy="9" r="1" fill="#1a5cf6" /></svg>
                                </div>
                                <div>
                                    <h4 className="fraunces" style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: 4 }}>{f.title}</h4>
                                    <p style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.65 }}>{f.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                    <Reveal delay={0.1}><Dashboard /></Reveal>
                </div>
            </div>
        </section>
    );
}

// ── AI FEATURES ──
const featCards = [
    { bg: "var(--blue-soft)", border: "var(--blue-border)", title: "Risk Zone Prediction", text: "ML models trained on millions of accident data points identify high-probability crash zones before any human notices a pattern.", pill: "Predictive ML" },
    { bg: "var(--green-soft)", border: "var(--green-border)", title: "Behavioral Detection", text: "Computer vision tracks lane weaving, tailgating, sudden braking, and driver fatigue — flagging dangerous behavior in real time.", pill: "Computer Vision" },
    { bg: "var(--red-soft)", border: "var(--red-border)", title: "Autonomous Decision Logic", text: "A multi-variable decision engine evaluates risk across dozens of factors simultaneously and triggers alerts or dispatches in under 2 seconds.", pill: "Decision AI" },
    { bg: "var(--amber-soft)", border: "rgba(180,83,9,0.15)", title: "Sensor Fusion Engine", text: "Integrates IoT sensors, CCTV, vehicle telemetry, weather APIs, and GPS into a single unified intelligence stream.", pill: "IoT Integration" },
    { bg: "var(--blue-soft)", border: "var(--blue-border)", title: "Adaptive Learning", text: "The model continuously retrains on new incident data — improving prediction accuracy with every event, alert, and outcome.", pill: "Continuous Learning" },
    { bg: "var(--green-soft)", border: "var(--green-border)", title: "Emergency Coordination", text: "Seamless API integration with police dispatch, hospitals, and traffic management — one event triggers the entire response chain automatically.", pill: "Systems Integration" },
];

function Features() {
    return (
        <section id="features" style={{ background: "var(--bg)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "100px 40px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 1, background: "var(--border-mid)", display: "inline-block" }} />Intelligence Layer
                </div>
                <h2 className="fraunces" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                    Not an app.<br />An <em style={{ fontStyle: "italic", color: "var(--blue)" }}>AI brain</em> for vehicles.
                </h2>
                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 56 }}>
                    {featCards.map((c, i) => (
                        <motion.div key={i} variants={staggerItem}
                            whileHover={{ y: -3, boxShadow: "0 6px 32px rgba(0,0,0,0.08)", borderColor: "var(--border-mid)" }}
                            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "30px 26px", transition: "all 0.25s", position: "relative", overflow: "hidden" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7" stroke="#1a5cf6" strokeWidth="1.4" strokeDasharray="3 2" /><circle cx="11" cy="11" r="3" stroke="#1a5cf6" strokeWidth="1.3" /><circle cx="11" cy="11" r="1.2" fill="#1a5cf6" /></svg>
                            </div>
                            <h3 className="fraunces" style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 8 }}>{c.title}</h3>
                            <p style={{ fontSize: "0.83rem", color: "var(--muted)", lineHeight: 1.7 }}>{c.text}</p>
                            <div style={{ display: "inline-block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginTop: 14, background: "var(--surface)", color: "var(--muted2)", border: "1px solid var(--border)" }}>{c.pill}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ── IMPACT ──
function Impact() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <section style={{ background: "var(--ink)" }}>
            <div ref={ref} style={{ maxWidth: 800, margin: "0 auto", padding: "120px 40px", textAlign: "center" }}>
                <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
                    style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                    <span style={{ width: 36, height: 1, background: "rgba(255,255,255,0.12)", display: "inline-block" }} />
                    Our Mission
                    <span style={{ width: 36, height: 1, background: "rgba(255,255,255,0.12)", display: "inline-block" }} />
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, delay: 0.2 }}
                    className="fraunces" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.4, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.9)" }}>
                    "We may not predict every accident.<br />
                    But if we <span style={{ color: "#ff7a5c", fontStyle: "normal", fontWeight: 500 }}>prevent even one</span> —<br />
                    and save a single life —<br />
                    our system is a <span style={{ color: "#5ce8a0", fontStyle: "normal", fontWeight: 500 }}>success</span>."
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.5 }}
                    style={{ marginTop: 28, fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
                    Every alert sent. Every second saved. Every life protected.
                </motion.p>
            </div>
        </section>
    );
}

// ── TECH STACK ──
const techItems = [
    "Python · FastAPI", "React + TypeScript", "TensorFlow / PyTorch", "OpenCV",
    "MQTT / WebSockets", "AWS / GCP", "PostgreSQL + Redis", "IoT Sensor Network", "Google Maps API"
];

function TechStack() {
    return (
        <section style={{ background: "var(--surface)" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "100px 40px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 1, background: "var(--border-mid)", display: "inline-block" }} />Built With
                </div>
                <h2 className="fraunces" style={{ fontSize: "1.7rem", fontWeight: 500, lineHeight: 1.15 }}>
                    Production-grade technology.<br />
                    <span style={{ color: "var(--muted)", fontWeight: 300, fontSize: "1.3rem", fontFamily: "'DM Sans', sans-serif" }}>Built to scale.</span>
                </h2>
                <Reveal>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 40 }}>
                        {techItems.map((t, i) => (
                            <motion.div key={i} whileHover={{ borderColor: "var(--border-mid)", color: "var(--ink)" }}
                                style={{ fontSize: "0.8rem", fontWeight: 500, padding: "8px 16px", borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", color: "var(--ink2)", display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s" }}>
                                {t}
                            </motion.div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ── CTA ──
function CTA() {
    return (
        <section id="cta" style={{ background: "var(--bg)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", bottom: -120, right: -120, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(214,58,30,0.06) 0%, transparent 70%)" }} />
            <Reveal>
                <div style={{ maxWidth: 720, margin: "0 auto", padding: "120px 40px", textAlign: "center", position: "relative" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <span style={{ width: 18, height: 1, background: "var(--border-mid)", display: "inline-block" }} />Ready to See It in Action
                    </div>
                    <h2 className="fraunces" style={{ fontSize: "clamp(1.9rem,4vw,3rem)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
                        The future of road safety<br />
                        <em style={{ fontStyle: "italic", color: "var(--red)" }}>starts before the crash.</em>
                    </h2>
                    <p style={{ fontSize: "1rem", color: "var(--muted2)", lineHeight: 1.75, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
                        SERS+ is redefining what an emergency system can be — not reactive, but intelligent. Not late, but ahead.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <motion.a href="#" whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(214,58,30,0.35)" }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.92rem", fontWeight: 600, color: "#fff", background: "var(--red)", padding: "14px 32px", borderRadius: 10, textDecoration: "none", boxShadow: "0 2px 16px rgba(214,58,30,0.25)" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.2" /><path d="M5.5 5L9 7L5.5 9V5Z" fill="white" /></svg>
                            Request a Live Demo
                        </motion.a>
                        <motion.a href="#how" whileHover={{ borderColor: "var(--ink)", background: "var(--surface)" }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: "0.92rem", fontWeight: 500, color: "var(--ink2)", background: "var(--card)", padding: "14px 26px", borderRadius: 10, border: "1px solid var(--border-mid)", textDecoration: "none" }}>
                            Learn How It Works
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 6.5H10M7 3.5L10 6.5L7 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </motion.a>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

// ── FOOTER ──
function Footer() {
    return (
        <footer style={{ padding: "32px 60px", borderTop: "1px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div className="fraunces" style={{ fontSize: "1rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, background: "var(--red)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldIcon />
                </div>
                SERS<span style={{ color: "var(--red)" }}>+</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>AI Accident Predictor &amp; Emergency Response System</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>Predict · Prevent · Respond</div>
        </footer>
    );
}

// ── DIVIDER ──
const Divider = () => <div style={{ height: 1, background: "var(--border)" }} />;

// ── ROOT ──
export default function SERSPlus() {
    return (
        <>
            <style>{globalStyles}</style>
            <Nav />
            <Hero />
            <StatsBar />
            <Problem />
            <Divider />
            <HowItWorks />
            <Divider />
            <Solution />
            <Divider />
            <Features />
            <Impact />
            <TechStack />
            <Divider />
            <CTA />
            <Footer />
        </>
    );
}