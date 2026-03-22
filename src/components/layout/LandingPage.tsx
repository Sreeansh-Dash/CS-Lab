// src/components/layout/LandingPage.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const modules = [
    {
        number: '01',
        id: 'pathfinding',
        title: 'PATHFINDING',
        subtitle: 'PLAYGROUND',
        description: 'Visualize BFS, DFS, Dijkstra, and A* on interactive grids.',
        icon: '◉',
        path: '/pathfinding',
        color: '#00D4FF',
        glow: 'rgba(0, 212, 255, 0.3)',
        moduleClass: 'module-pathfinding',
        topics: ['BFS · DFS', 'Dijkstra · A*', 'Mazes · Weights'],
    },
    {
        number: '02',
        id: 'dataStructures',
        title: 'DATA STRUCTURES',
        subtitle: 'MEMORY & FLOW',
        description: 'Sorting race with 9 algorithms and interactive linked list memory.',
        icon: '◈',
        path: '/data-structures',
        color: '#A855F7',
        glow: 'rgba(168, 85, 247, 0.35)',
        moduleClass: 'module-datastructures',
        topics: ['Sorting Race', 'Linked Lists', 'Heap · Radix'],
    },
    {
        number: '03',
        id: 'det',
        title: 'SIGNALS',
        subtitle: '& SYSTEMS',
        description: 'Combine waves, view FFT frequency domains, and explore transforms.',
        icon: '∿',
        path: '/det',
        color: '#39FF14',
        glow: 'rgba(57, 255, 20, 0.25)',
        moduleClass: 'module-det',
        topics: ['Fourier · FFT', 'Laplace · 3D', 'Wave Combiner'],
    },
    {
        number: '04',
        id: 'dmgt',
        title: 'DISCRETE MATH',
        subtitle: '& GRAPH THEORY',
        description: 'Build predicates, evaluate quantifiers, and prove theorems.',
        icon: '∀',
        path: '/dmgt',
        color: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.3)',
        moduleClass: 'module-dmgt',
        topics: ['Predicate Logic', 'Quantifiers', 'Proof Methods'],
    },
    {
        number: '05',
        id: 'networks',
        title: 'COMPUTER',
        subtitle: 'NETWORKS',
        description: 'Simulate error detection, CRC, and ARQ flow control protocols.',
        icon: '⊻',
        path: '/networks',
        color: '#06B6D4',
        glow: 'rgba(6, 182, 212, 0.3)',
        moduleClass: 'module-networks',
        topics: ['Error Detection', 'CRC · Parity', 'ARQ Flow Control'],
    },
    {
        number: '06',
        id: 'os',
        title: 'OPERATING',
        subtitle: 'SYSTEMS',
        description: 'Build Resource Allocation Graphs and detect deadlocks visually.',
        icon: '◎',
        path: '/os',
        color: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.35)',
        moduleClass: 'module-os',
        topics: ['Deadlock RAG', "Banker's Algo", 'Multi-Instance'],
    },
];

// Animated particle network background
function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const particles: { x: number; y: number; vx: number; vy: number }[] = [];
        const COUNT = 60;
        const CONNECTION_DIST = 150;

        const resize = () => {
            canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
            canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        };

        const init = () => {
            particles.length = 0;
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            for (let i = 0; i < COUNT; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                });
            }
        };

        const draw = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            // Update positions
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const alpha = (1 - dist / CONNECTION_DIST) * 0.2;
                        ctx.strokeStyle = `rgba(77, 124, 254, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw dots
            for (const p of particles) {
                ctx.fillStyle = 'rgba(77, 124, 254, 0.5)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };

        resize();
        init();
        draw();

        window.addEventListener('resize', () => {
            resize();
            init();
        });

        return () => {
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        />
    );
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.3 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

export default function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Particle Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                pointerEvents: 'none',
            }}>
                <ParticleField />
            </div>

            {/* Hero Section */}
            <div
                style={{
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 'var(--space-16) var(--space-8)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Eyebrow */}
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--accent-cyan)',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: 'var(--space-4)',
                    }}
                >
                    Interactive Learning Platform
                </motion.span>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-3xl)',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        marginBottom: 'var(--space-3)',
                    }}
                >
                    Learn CS by Doing
                </motion.h1>

                {/* Subhead */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 400,
                        fontStyle: 'italic',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--space-6)',
                    }}
                >
                    Not by memorising.
                </motion.p>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-secondary)',
                        maxWidth: 520,
                        lineHeight: 1.6,
                        marginBottom: 'var(--space-6)',
                    }}
                >
                    Master algorithms, data structures, signals, networks, and OS concepts
                    through interactive visualizations and step-by-step animations.
                </motion.p>

                {/* Hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    style={{
                        fontFamily: 'var(--font-code)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--space-4)',
                    }}
                >
                    Press [1]–[6] to jump to any module  ·  Press [?] for all shortcuts
                </motion.p>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-secondary)',
                        maxWidth: 520,
                        lineHeight: 1.6,
                        marginBottom: 'var(--space-8)',
                    }}
                >
                    Master algorithms, data structures, signals, networks, and OS concepts
                    through interactive visualizations and step-by-step animations.
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Link to="/pathfinding">
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(77, 124, 254, 0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                background: 'var(--accent-blue)',
                                color: '#fff',
                                border: 'none',
                                padding: '16px 40px',
                                borderRadius: 'var(--radius-lg)',
                                fontFamily: 'var(--font-body)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: 'var(--glow-blue)',
                                letterSpacing: '0.01em',
                            }}
                        >
                            Start Exploring →
                        </motion.button>
                    </Link>
                </motion.div>
            </div>

            {/* Module Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: 'var(--space-6)',
                    padding: '0 var(--space-8) var(--space-16)',
                    maxWidth: 1280,
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {modules.map((mod, index) => (
                    <motion.div key={mod.id} variants={cardVariants}>
                        <Link to={mod.path} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                            <motion.div
                                whileHover={{
                                    y: -4,
                                    scale: 1.02,
                                    boxShadow: `0 8px 32px ${mod.glow}`,
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                style={{
                                    background: 'var(--bg-surface)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-6)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: `1px solid var(--border-subtle)`,
                                    animationDelay: `${index * 80}ms`,
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = mod.color;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = '';
                                }}
                            >
                                {/* Number */}
                                <span style={{
                                    fontFamily: 'var(--font-code)',
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    letterSpacing: '0.1em',
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                }}>{mod.number}</span>

                                {/* Icon */}
                                <span style={{
                                    fontSize: '28px',
                                    display: 'block',
                                    marginBottom: 'var(--space-3)',
                                    color: mod.color,
                                }}>{mod.icon}</span>

                                {/* Title */}
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    marginBottom: 'var(--space-1)',
                                    lineHeight: 1.2,
                                }}>{mod.title}</h3>

                                {/* Subtitle */}
                                <span style={{
                                    fontFamily: 'var(--font-code)',
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase' as const,
                                    letterSpacing: '0.1em',
                                    display: 'block',
                                    marginBottom: 'var(--space-4)',
                                }}>{mod.subtitle}</span>

                                {/* Topics */}
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-4) 0' }}>
                                    {mod.topics.map(topic => (
                                        <li key={topic} style={{
                                            fontSize: '13px',
                                            color: 'var(--text-secondary)',
                                            padding: '2px 0',
                                        }}>
                                            <span style={{ color: mod.color }}>· </span>{topic}
                                        </li>
                                    ))}
                                </ul>

                                {/* Arrow */}
                                <span style={{
                                    position: 'absolute',
                                    bottom: 'var(--space-4)',
                                    right: 'var(--space-4)',
                                    fontSize: '20px',
                                    color: mod.color,
                                    transition: 'transform 200ms ease',
                                }}>→</span>
                            </motion.div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
