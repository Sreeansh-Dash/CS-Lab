// src/modules/dmgt/components/ProofWorkbench.tsx
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

type ProofMethod = 'direct' | 'forward-chaining' | 'backward-chaining' | 'resolution';

interface ProofStep {
    id: number;
    label: string;
    expression: string;
    justification: string;
}

interface PreloadedExample {
    title: string;
    premises: string[];
    conclusion: string;
    steps: Record<ProofMethod, ProofStep[]>;
}

const EXAMPLES: PreloadedExample[] = [
    {
        title: 'Modus Ponens: If p→q and p, then q',
        premises: ['p → q', 'p'],
        conclusion: 'q',
        steps: {
            'direct': [
                { id: 1, label: 'Premise', expression: 'p → q', justification: 'Given' },
                { id: 2, label: 'Premise', expression: 'p', justification: 'Given' },
                { id: 3, label: 'Conclusion', expression: 'q', justification: 'Modus Ponens (1, 2)' },
            ],
            'forward-chaining': [
                { id: 1, label: 'Start', expression: 'p', justification: 'Known fact' },
                { id: 2, label: 'Apply Rule', expression: 'p → q fires', justification: 'p matches antecedent' },
                { id: 3, label: 'Derived', expression: 'q', justification: 'Consequent derived' },
            ],
            'backward-chaining': [
                { id: 1, label: 'Goal', expression: 'q', justification: 'Target to prove' },
                { id: 2, label: 'Find Rule', expression: 'p → q', justification: 'q matches consequent' },
                { id: 3, label: 'Subgoal', expression: 'p', justification: 'Need to prove p' },
                { id: 4, label: 'Success', expression: 'p is given ✓', justification: 'p is a known premise' },
            ],
            'resolution': [
                { id: 1, label: 'Clause 1', expression: '{¬p, q}', justification: 'From p → q' },
                { id: 2, label: 'Clause 2', expression: '{p}', justification: 'From premise p' },
                { id: 3, label: 'Resolve', expression: '{q}', justification: 'Resolve p with ¬p' },
            ],
        },
    },
    {
        title: 'Hypothetical Syllogism: p→q, q→r ⊢ p→r',
        premises: ['p → q', 'q → r'],
        conclusion: 'p → r',
        steps: {
            'direct': [
                { id: 1, label: 'Premise', expression: 'p → q', justification: 'Given' },
                { id: 2, label: 'Premise', expression: 'q → r', justification: 'Given' },
                { id: 3, label: 'Assume', expression: 'p', justification: 'Assumption for direct proof' },
                { id: 4, label: 'Derive', expression: 'q', justification: 'Modus Ponens (1, 3)' },
                { id: 5, label: 'Derive', expression: 'r', justification: 'Modus Ponens (2, 4)' },
                { id: 6, label: 'Conclusion', expression: 'p → r', justification: 'Direct proof (3→5)' },
            ],
            'forward-chaining': [
                { id: 1, label: 'Start', expression: 'Assume p', justification: 'Working forward from p' },
                { id: 2, label: 'Chain', expression: 'p → q fires → q', justification: 'First rule applied' },
                { id: 3, label: 'Chain', expression: 'q → r fires → r', justification: 'Second rule applied' },
                { id: 4, label: 'Result', expression: 'p → r', justification: 'Chain complete' },
            ],
            'backward-chaining': [
                { id: 1, label: 'Goal', expression: 'p → r', justification: 'Target' },
                { id: 2, label: 'Subgoal', expression: 'Need r when p', justification: 'Decompose conditional' },
                { id: 3, label: 'Find', expression: 'q → r', justification: 'r from q → r' },
                { id: 4, label: 'Subgoal', expression: 'Need q when p', justification: 'New subgoal' },
                { id: 5, label: 'Find', expression: 'p → q', justification: 'q from p → q ✓' },
            ],
            'resolution': [
                { id: 1, label: 'Clause 1', expression: '{¬p, q}', justification: 'From p → q' },
                { id: 2, label: 'Clause 2', expression: '{¬q, r}', justification: 'From q → r' },
                { id: 3, label: 'Resolve', expression: '{¬p, r}', justification: 'Resolve q with ¬q' },
                { id: 4, label: 'Result', expression: 'p → r', justification: 'Equivalent to {¬p, r}' },
            ],
        },
    },
    {
        title: 'Disjunctive Syllogism: p∨q, ¬p ⊢ q',
        premises: ['p ∨ q', '¬p'],
        conclusion: 'q',
        steps: {
            'direct': [
                { id: 1, label: 'Premise', expression: 'p ∨ q', justification: 'Given' },
                { id: 2, label: 'Premise', expression: '¬p', justification: 'Given' },
                { id: 3, label: 'Conclusion', expression: 'q', justification: 'Disjunctive Syllogism (1, 2)' },
            ],
            'forward-chaining': [
                { id: 1, label: 'Known', expression: '¬p', justification: 'Fact' },
                { id: 2, label: 'Known', expression: 'p ∨ q', justification: 'Fact' },
                { id: 3, label: 'Eliminate', expression: 'p is false in p ∨ q', justification: '¬p eliminates p' },
                { id: 4, label: 'Derived', expression: 'q', justification: 'Remaining disjunct' },
            ],
            'backward-chaining': [
                { id: 1, label: 'Goal', expression: 'q', justification: 'Target' },
                { id: 2, label: 'Source', expression: 'p ∨ q', justification: 'q appears in disjunction' },
                { id: 3, label: 'Check', expression: '¬p holds', justification: 'p eliminated by ¬p' },
                { id: 4, label: 'Success', expression: 'q ✓', justification: 'Goal proven' },
            ],
            'resolution': [
                { id: 1, label: 'Clause 1', expression: '{p, q}', justification: 'From p ∨ q' },
                { id: 2, label: 'Clause 2', expression: '{¬p}', justification: 'From ¬p' },
                { id: 3, label: 'Resolve', expression: '{q}', justification: 'Resolve p with ¬p' },
            ],
        },
    },
    {
        title: 'Contrapositive: p→q ⊢ ¬q→¬p',
        premises: ['p → q'],
        conclusion: '¬q → ¬p',
        steps: {
            'direct': [
                { id: 1, label: 'Premise', expression: 'p → q', justification: 'Given' },
                { id: 2, label: 'Assume', expression: '¬q', justification: 'Assume for contrapositive' },
                { id: 3, label: 'Suppose', expression: 'p (for contradiction)', justification: 'Assume p' },
                { id: 4, label: 'Derive', expression: 'q', justification: 'Modus Ponens (1, 3)' },
                { id: 5, label: 'Contradiction', expression: 'q ∧ ¬q', justification: 'Steps 2, 4 contradict' },
                { id: 6, label: 'Conclusion', expression: '¬p', justification: 'Proof by contradiction' },
                { id: 7, label: 'Result', expression: '¬q → ¬p', justification: 'Conditional proof (2→6)' },
            ],
            'forward-chaining': [
                { id: 1, label: 'Rule', expression: 'p → q', justification: 'Given rule' },
                { id: 2, label: 'Transform', expression: '¬q → ¬p', justification: 'Logical equivalence (contrapositive)' },
            ],
            'backward-chaining': [
                { id: 1, label: 'Goal', expression: '¬q → ¬p', justification: 'Target' },
                { id: 2, label: 'Recognize', expression: 'Contrapositive of p → q', justification: 'Logically equivalent' },
                { id: 3, label: 'Verify', expression: 'p → q is given ✓', justification: 'Premise available' },
            ],
            'resolution': [
                { id: 1, label: 'Clause', expression: '{¬p, q}', justification: 'From p → q' },
                { id: 2, label: 'Rewrite', expression: '{q, ¬p}', justification: 'Same as {¬(¬q), ¬p}' },
                { id: 3, label: 'Result', expression: '¬q → ¬p', justification: 'Contrapositive form' },
            ],
        },
    },
];

const METHODS: { id: ProofMethod; label: string; icon: string }[] = [
    { id: 'direct', label: 'Direct Proof', icon: '→' },
    { id: 'forward-chaining', label: 'Forward Chaining', icon: '⇒' },
    { id: 'backward-chaining', label: 'Backward Chaining', icon: '⇐' },
    { id: 'resolution', label: 'Resolution', icon: '⊥' },
];

export function ProofWorkbench() {
    const [selectedExample, setSelectedExample] = useState(0);
    const [activeMethod, setActiveMethod] = useState<ProofMethod>('direct');
    const [currentStepIdx, setCurrentStepIdx] = useState(0);

    const example = EXAMPLES[selectedExample];
    const steps = useMemo(() => example.steps[activeMethod], [example, activeMethod]);

    const visibleSteps = steps.slice(0, currentStepIdx + 1);

    const nextStep = () => {
        if (currentStepIdx < steps.length - 1) setCurrentStepIdx(i => i + 1);
    };
    const prevStep = () => {
        if (currentStepIdx > 0) setCurrentStepIdx(i => i - 1);
    };
    const resetSteps = () => setCurrentStepIdx(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
            {/* Example Selector */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {EXAMPLES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setSelectedExample(i); setCurrentStepIdx(0); }}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: selectedExample === i ? '#F59E0B' : 'var(--border-subtle)',
                            background: selectedExample === i ? 'rgba(245,158,11,0.1)' : 'transparent',
                            color: selectedExample === i ? '#F59E0B' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-code)',
                            fontSize: '12px',
                        }}
                    >
                        Ex {i + 1}
                    </button>
                ))}
            </div>

            {/* Example Info */}
            <div style={{
                padding: 'var(--space-3)',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
            }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, color: '#F59E0B', marginBottom: 'var(--space-2)' }}>
                    {example.title}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Premises</span>
                        <div style={{ fontFamily: 'var(--font-code)', fontSize: '14px', color: 'var(--text-primary)' }}>
                            {example.premises.join(', ')}
                        </div>
                    </div>
                    <div>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Conclusion</span>
                        <div style={{ fontFamily: 'var(--font-code)', fontSize: '14px', color: '#F59E0B' }}>
                            ∴ {example.conclusion}
                        </div>
                    </div>
                </div>
            </div>

            {/* Method Tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                {METHODS.map(m => (
                    <button
                        key={m.id}
                        onClick={() => { setActiveMethod(m.id); setCurrentStepIdx(0); }}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '13px',
                            fontWeight: activeMethod === m.id ? 600 : 400,
                            background: activeMethod === m.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                            color: activeMethod === m.id ? '#F59E0B' : 'var(--text-muted)',
                        }}
                    >
                        {m.icon} {m.label}
                    </button>
                ))}
            </div>

            {/* Proof Steps */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {visibleSteps.map((step, i) => (
                    <motion.div
                        key={`${activeMethod}-${step.id}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.05 }}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-3)',
                            background: i === visibleSteps.length - 1 ? 'rgba(245,158,11,0.08)' : 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid',
                            borderColor: i === visibleSteps.length - 1 ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)',
                        }}
                    >
                        {/* Step Number */}
                        <span style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#F59E0B',
                            opacity: 0.5,
                            minWidth: 24,
                        }}>
                            {step.id}.
                        </span>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: 'var(--font-code)',
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase' as const,
                                letterSpacing: '0.1em',
                                marginBottom: 2,
                            }}>
                                {step.label}
                            </div>
                            <div style={{
                                fontFamily: "'Source Serif 4', serif",
                                fontSize: '16px',
                                color: 'var(--text-primary)',
                            }}>
                                {step.expression}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                marginTop: 2,
                                fontStyle: 'italic',
                            }}>
                                {step.justification}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Step Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) 0',
                borderTop: '1px solid var(--border-subtle)',
            }}>
                <button onClick={resetSteps} style={ctrlBtnStyle}>⟲</button>
                <button onClick={prevStep} disabled={currentStepIdx <= 0} style={ctrlBtnStyle}>←</button>
                <span style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    flex: 1,
                    textAlign: 'center',
                }}>
                    Step {currentStepIdx + 1} / {steps.length}
                </span>
                <button onClick={nextStep} disabled={currentStepIdx >= steps.length - 1} style={ctrlBtnStyle}>→</button>
            </div>
        </div>
    );
}

const ctrlBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
