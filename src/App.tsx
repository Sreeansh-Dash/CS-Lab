// src/App.tsx
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { KeyboardShortcutsOverlay } from './components/ui/KeyboardShortcutsOverlay';
import { useAppStore } from './store/appStore';

// Lazy-loaded module routes
const PathfindingModule = lazy(() => import('./modules/pathfinding/PathfindingModule'));
const DataStructuresModule = lazy(() => import('./modules/dataStructures/DataStructuresModule'));
const DETModule = lazy(() => import('./modules/det/DETModule'));
const DMGTModule = lazy(() => import('./modules/dmgt/DMGTModule'));
const NetworksModule = lazy(() => import('./modules/networks/NetworksModule'));
const OSModule = lazy(() => import('./modules/os/OSModule'));
const LandingPage = lazy(() => import('./components/layout/LandingPage'));

const MODULE_ROUTES = ['/pathfinding', '/data-structures', '/det', '/dmgt', '/networks', '/os'];

function AppLoader() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flex: 1,
                gap: 'var(--space-4)',
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '3px solid var(--border-default)',
                    borderTopColor: 'var(--accent-blue)',
                    animation: 'spin 1s linear infinite',
                }}
            />
            <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
            }}>
                Loading module...
            </span>
        </div>
    );
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<AppLoader />} key={location.pathname}>
                <Routes location={location}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/pathfinding" element={<PathfindingModule />} />
                    <Route path="/data-structures" element={<DataStructuresModule />} />
                    <Route path="/det" element={<DETModule />} />
                    <Route path="/dmgt" element={<DMGTModule />} />
                    <Route path="/networks" element={<NetworksModule />} />
                    <Route path="/os" element={<OSModule />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
}

function GlobalKeyboardHandler({ shortcutsOpen, setShortcutsOpen }: { shortcutsOpen: boolean; setShortcutsOpen: (v: boolean) => void }) {
    const navigate = useNavigate();
    const toggleTheme = useAppStore(s => s.toggleTheme);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if focused on input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        // Ctrl+Shift+D — toggle theme
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggleTheme();
            return;
        }

        // ? — toggle shortcuts overlay
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            setShortcutsOpen(!shortcutsOpen);
            return;
        }

        // Escape — close overlay
        if (e.key === 'Escape' && shortcutsOpen) {
            setShortcutsOpen(false);
            return;
        }

        // Don't handle nav shortcuts when overlay is open
        if (shortcutsOpen) return;

        // 1-6: module navigation
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
            e.preventDefault();
            navigate(MODULE_ROUTES[num - 1]);
            return;
        }

        // H: go home
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            navigate('/');
            return;
        }
    }, [navigate, toggleTheme, shortcutsOpen, setShortcutsOpen]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return null;
}

function App() {
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    return (
        <BrowserRouter>
            <GlobalKeyboardHandler shortcutsOpen={shortcutsOpen} setShortcutsOpen={setShortcutsOpen} />
            <KeyboardShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
            <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg-void)' }}>
                <Sidebar onOpenShortcuts={() => setShortcutsOpen(true)} />
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    overflow: 'hidden',
                }}>
                    <TopNav />
                    <main style={{ flex: 1, overflow: 'auto' }}>
                        <AnimatedRoutes />
                    </main>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
