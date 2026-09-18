'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ArrowLeftRight, User, ClipboardList, PieChart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './BottomNav.module.css';

const userNav = [
    { href: '/', label: 'หน้าหลัก', icon: LayoutDashboard },
    { href: '/items', label: 'ค้นหา', icon: Package },
    { href: '/my-borrows', label: 'ยืม-คืน', icon: ArrowLeftRight },
    { href: '/profile', label: 'ฉัน', icon: User },
];

const adminNav = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/items', label: 'จัดการ', icon: Package },
    { href: '/admin/borrows', label: 'คำขอ', icon: ClipboardList },
    { href: '/admin/reports', label: 'รายงาน', icon: PieChart },
    { href: '/profile', label: 'ฉัน', icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { isAdmin } = useAuth();
    const navItems = isAdmin ? adminNav : userNav;

    // Draggable Logic
    const [snapMode, setSnapMode] = useState('bottom'); // 'bottom', 'left', 'right'
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e) => {
            // Support Touch API to prevent mouse conflicts on devices
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            setOffset({
                x: clientX - dragStart.current.x,
                y: clientY - dragStart.current.y
            });
        };

        const handleUp = (e) => {
            setIsDragging(false);

            const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            // Snap Logic
            if (clientY < screenH * 0.3) {
                // If thrown to the top 30%, explicitly force back to bottom
                setSnapMode('bottom');
            } else if (clientX < screenW * 0.3) {
                setSnapMode('left');
            } else if (clientX > screenW * 0.7) {
                setSnapMode('right');
            } else {
                setSnapMode('bottom');
            }

            setOffset({ x: 0, y: 0 });
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging]);

    const handlePointerDown = (e) => {
        setIsDragging(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStart.current = { x: clientX - offset.x, y: clientY - offset.y };
    };

    return (
        <nav
            className={`${styles.bottomNav} ${styles[snapMode]} ${isDragging ? styles.dragging : ''}`}
            style={isDragging ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : {}}
        >
            <div
                className={styles.dragHandle}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
            >
                <div className={styles.gripIndicator} />
            </div>

            <div className={styles.navContainer}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Fix nested sub-routing overlap glitch dynamically
                    const exactMatch = pathname === item.href;
                    const isChildMatch = item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href + '/') && !navItems.some(nav => nav.href === pathname);
                    const isActive = exactMatch || isChildMatch;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <div className={styles.iconWrapper}>
                                <Icon size={24} />
                            </div>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
