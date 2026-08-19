'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import BorrowBot from '@/components/BorrowBot';
import { useAuth } from '@/context/AuthContext';

const authPages = ['/login', '/register'];

export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, isAdmin } = useAuth();
    const isAuthPage = authPages.includes(pathname);

    // Wait for client mount before doing any routing
    useEffect(() => {
        setMounted(true);
    }, []);

    const navigate = useCallback((path) => {
        // Use setTimeout to avoid "Router action dispatched before initialization"
        setTimeout(() => {
            router.push(path);
        }, 0);
    }, [router]);

    useEffect(() => {
        if (loading || !mounted) return;

        // Not logged in? Go to login
        if (!user && !isAuthPage) {
            navigate('/login');
            return;
        }

        // Logged in but on auth page? Redirect to dashboard
        if (user && isAuthPage) {
            navigate(isAdmin ? '/admin' : '/');
            return;
        }

        // Logged in: enforce correct section
        if (user) {
            // Admin trying to access user pages (except /profile, /items, /settings)
            if (isAdmin && !pathname.startsWith('/admin') && pathname !== '/profile' && !pathname.startsWith('/items') && !pathname.startsWith('/settings')) {
                navigate('/admin');
                return;
            }
            // User trying to access admin pages
            if (!isAdmin && pathname.startsWith('/admin')) {
                navigate('/');
                return;
            }
        }
    }, [user, loading, isAuthPage, isAdmin, pathname, mounted, navigate]);

    // Loading state
    if (loading || !mounted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
            }}>
                กำลังโหลด...
            </div>
        );
    }

    // Auth pages
    if (isAuthPage) {
        return <>{children}</>;
    }

    // Not logged in
    if (!user) {
        return null;
    }

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content">
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                {children}
            </div>
            <BorrowBot />
        </div>
    );
}
