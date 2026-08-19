'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ArrowLeftRight, User, PlusCircle, ClipboardList } from 'lucide-react';
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
    { href: '/profile', label: 'ฉัน', icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { isAdmin } = useAuth();
    const navItems = isAdmin ? adminNav : userNav;

    return (
        <nav className={styles.bottomNav}>
            <div className={styles.navContainer}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href));

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
