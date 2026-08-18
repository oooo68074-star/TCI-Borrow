'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Package, ArrowLeftRight, PlusCircle,
    User, ChevronLeft, Sparkles, ClipboardList, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

const userNav = [
    { href: '/', label: 'หน้าหลัก', icon: LayoutDashboard },
    { href: '/items', label: 'ค้นหาของยืม', icon: Package },
    { href: '/my-borrows', label: 'รายการยืมของฉัน', icon: ArrowLeftRight },
    { href: '/profile', label: 'โปรไฟล์', icon: User },
    { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

const adminNav = [
    { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/admin/items', label: 'จัดการของ', icon: Package },
    { href: '/admin/items/new', label: 'เพิ่มของใหม่', icon: PlusCircle },
    { href: '/admin/borrows', label: 'จัดการคำขอยืม', icon: ClipboardList },
    { href: '/profile', label: 'โปรไฟล์', icon: User },
    { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const { user, isAdmin, logout } = useAuth();

    const navItems = isAdmin ? adminNav : userNav;

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={onClose} />}

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Logo */}
                <div className={styles.logo}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '12px' }}>
                        <img src="/logo.png" alt="TCIMCRU Logo" style={{ width: '180px', height: 'auto' }} />
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <ChevronLeft size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    <span className={styles.navLabel}>
                        {isAdmin ? 'เมนูแอดมิน' : 'เมนูหลัก'}
                    </span>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={onClose}
                            >
                                <div className={styles.navIcon}>
                                    <Icon size={20} />
                                </div>
                                <span>{item.label}</span>
                                {isActive && <div className={styles.activeIndicator} />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className={styles.userSection}>
                    {user && (
                        <div className={styles.userInfo}>
                            <div className="avatar avatar-sm" style={user?.avatar ? { background: `url(${user.avatar}) center/cover no-repeat` } : {}}>
                                {!user?.avatar && user?.name?.[0]}
                            </div>
                            <div className={styles.userName}>
                                <p>{user.name}</p>
                                <span>{user.email}</span>
                            </div>
                        </div>
                    )}
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogOut size={16} />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>

                {/* Bottom Card */}
                <div className={styles.bottomCard}>
                    <div className={styles.cardGlow} />
                    {isAdmin ? (
                        <>
                            <p className={styles.cardTitle}>🔒 Admin Panel</p>
                            <p className={styles.cardDesc}>จัดการระบบยืม-คืน</p>
                        </>
                    ) : (
                        <>
                            <p className={styles.cardTitle}>🎓 University Project</p>
                            <p className={styles.cardDesc}>BorrowHub v1.0</p>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
