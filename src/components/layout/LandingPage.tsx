// src/components/layout/LandingPage.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const modules = [
    {
        id: 'pathfinding',
        title: 'PATHFINDING',
        subtitle: 'PLAYGROUND',
        description: 'Visualize graph traversal algorithms in real-time on interactive grids.',
        path: '/pathfinding',
        color: '#00E5FF',
        glow: 'rgba(0, 229, 255, 0.35)',
        complexity: 'O(V + E)',
        size: 'large',
    },
    {
        id: 'data-structures',
        title: 'DATA STRUCTURES',
        subtitle: 'MEMORY & FLOW',
        description: 'Sorting race with 9 algorithms and interactive linked list memory blocks.',
        path: '/data-structures',
        color: '#39FF14',
        glow: 'rgba(57, 255, 20, 0.35)',
        complexity: 'O(N log N)',
        size: 'large',
    },
    {
        id: 'det',
        title: 'SIGNALS',
        subtitle: '& SYSTEMS',
        description: 'Combine waves and view FFT frequency domains.',
        path: '/det',
        color: '#00B8FF',
        glow: 'rgba(0, 184, 255, 0.35)',
        complexity: 'O(N log N)',
        size: 'small',
    },
    {
        id: 'dmgt',
        title: 'DISCRETE MATH',
        subtitle: '& LOGIC',
        description: 'Build predicates and evaluate quantifiers.',
        path: '/dmgt',
        color: '#FF00C8',
        glow: 'rgba(255, 0, 200, 0.35)',
        complexity: '∀x ∃y',
        size: 'small',
    },
    {
        id: 'networks',
        title: 'COMPUTER',
        subtitle: 'NETWORKS',
        description: 'Simulate error detection and ARQ protocols.',
        path: '/networks',
        color: '#FF8C00',
        glow: 'rgba(255, 140, 0, 0.35)',
        complexity: 'CRC-32',
        size: 'small',
    },
    {
        id: 'os',
        title: 'OPERATING',
        subtitle: 'SYSTEMS',
        description: 'Build RAGs and detect deadlocks visually.',
        path: '/os',
        color: '#FF2244',
        glow: 'rgba(255, 34, 68, 0.35)',
        complexity: 'Deadlock-Free',
        size: 'small',
    },
];

const PortalAnimation = () => (
    <div className="portal-container">
        <motion.div 
            className="portal-ring ring-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
            className="portal-ring ring-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div className="portal-core">
            <span className="portal-text">ENTER LAB</span>
        </div>
    </div>
);

const ModuleCard = ({ mod }: { mod: typeof modules[0] }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`module-card ${mod.size}`}
        style={{ 
            '--card-accent': mod.color,
            '--card-glow': mod.glow 
        } as any}
    >
        <Link to={mod.path} className="card-link">
            <div className="card-hud-corners" />
            <div className="card-content">
                <h3 className="card-title">{mod.title}</h3>
                <span className="card-subtitle">{mod.subtitle}</span>
                <p className="card-description">{mod.description}</p>
                <div className="card-footer">
                    <span className="card-complexity">Complexity: {mod.complexity}</span>
                </div>
            </div>
        </Link>
    </motion.div>
);

export default function LandingPage() {
    const featured = modules.filter(m => m.size === 'large');
    const standard = modules.filter(m => m.size === 'small');

    return (
        <div className="landing-page home-grid-overlay">
            <header className="hero-section">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hero-title"
                >
                    LEARN CS BY DOING
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="hero-subtitle"
                >
                    Not by memorising. Master concepts through interactive visualizations.
                </motion.p>
            </header>

            <main className="cards-container">
                <div className="featured-row">
                    <ModuleCard mod={featured[0]} />
                    <PortalAnimation />
                    <ModuleCard mod={featured[1]} />
                </div>
                <div className="standard-grid">
                    {standard.map(mod => (
                        <ModuleCard key={mod.id} mod={mod} />
                    ))}
                </div>
            </main>

            <style>{`
                .landing-page {
                    min-height: 100vh;
                    padding: 60px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    overflow-x: hidden;
                    background-color: var(--bg-app);
                }

                .hero-section {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .hero-title {
                    font-family: var(--font-display);
                    font-size: clamp(32px, 6vw, 64px);
                    font-weight: 900;
                    color: #FFFFFF;
                    letter-spacing: 0.12em;
                    margin: 0 0 16px;
                    text-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
                }

                .hero-subtitle {
                    font-family: var(--font-mono);
                    font-size: 16px;
                    color: var(--text-secondary);
                    letter-spacing: 0.04em;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .cards-container {
                    max-width: 1200px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .featured-row {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    gap: 40px;
                }

                .standard-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                }

                /* Portal Styles */
                .portal-container {
                    position: relative;
                    width: 220px;
                    height: 220px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .portal-ring {
                    position: absolute;
                    border: 2px solid transparent;
                    border-radius: 50%;
                }

                .ring-1 {
                    width: 100%;
                    height: 100%;
                    border-top-color: var(--cyan);
                    border-bottom-color: var(--cyan);
                    box-shadow: 0 0 20px var(--cyan-glow);
                }

                .ring-2 {
                    width: 80%;
                    height: 80%;
                    border-left-color: var(--magenta);
                    border-right-color: var(--magenta);
                    box-shadow: 0 0 20px var(--magenta-glow);
                }

                .portal-core {
                    width: 60%;
                    height: 60%;
                    background: radial-gradient(circle, rgba(0,229,255,0.2) 0%, transparent 70%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .portal-text {
                    font-family: var(--font-display);
                    font-size: 12px;
                    color: var(--cyan);
                    letter-spacing: 0.2em;
                    text-shadow: 0 0 10px var(--cyan-glow);
                }

                /* Module Card Styles */
                .module-card {
                    background: rgba(15, 26, 40, 0.8);
                    border: 1px solid rgba(0, 229, 255, 0.1);
                    border-radius: var(--r-lg);
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .module-card:hover {
                    border-color: var(--card-accent);
                    box-shadow: 0 0 30px var(--card-glow), inset 0 0 20px rgba(0,0,0,0.4);
                }

                .card-link {
                    display: block;
                    padding: 24px;
                    text-decoration: none;
                    color: inherit;
                    height: 100%;
                }

                .module-card.large {
                    min-height: 380px;
                }

                .module-card.small {
                    min-height: 220px;
                }

                .card-hud-corners::before,
                .card-hud-corners::after {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    border-color: var(--card-accent);
                    border-style: solid;
                }

                .card-hud-corners::before {
                    top: 10px;
                    left: 10px;
                    border-width: 2px 0 0 2px;
                }

                .card-hud-corners::after {
                    bottom: 10px;
                    right: 10px;
                    border-width: 0 2px 2px 0;
                }

                .card-title {
                    font-family: var(--font-display);
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--card-accent);
                    margin: 0 0 4px;
                    letter-spacing: 0.05em;
                }

                .card-subtitle {
                    font-family: var(--font-heading);
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    display: block;
                    margin-bottom: 16px;
                    letter-spacing: 0.02em;
                }

                .card-description {
                    font-family: var(--font-body);
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin-bottom: 24px;
                }

                .card-footer {
                    margin-top: auto;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .card-complexity {
                    font-family: var(--font-mono);
                    font-size: 11px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }

                @media (max-width: 1024px) {
                    .featured-row {
                        grid-template-columns: 1fr;
                        justify-items: center;
                    }
                    .standard-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .portal-container {
                        order: -1;
                        margin-bottom: 20px;
                    }
                }

                @media (max-width: 640px) {
                    .standard-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
