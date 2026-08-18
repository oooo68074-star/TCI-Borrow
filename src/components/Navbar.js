'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Search, Bell, Menu, X, LogOut, User, Settings, Check, Trash2, Moon, Sun
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar({ onToggleSidebar }) {
    const { user, logout } = useAuth();
    const { notifications, setCurrentUserId, markNotificationRead, markAllNotificationsRead, clearAllNotifications } = useData();
    const { theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const notifRef = useRef(null);
    const userRef = useRef(null);
    const router = useRouter();

    // Sync current user id to DataContext for notification filtering
    useEffect(() => {
        if (user?.id) {
            setCurrentUserId(user.id);
        }
    }, [user?.id, setCurrentUserId]);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (userRef.current && !userRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/items?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2);
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 1) return 'เมื่อสักครู่';
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        const days = Math.floor(hours / 24);
        return `${days} วันที่แล้ว`;
    };

    const handleNotifClick = async (notif) => {
        if (!notif.read) {
            await markNotificationRead(notif.id);
        }
        setShowNotifications(false);
        if (notif.link) {
            router.push(notif.link);
        }
    };

    const getNotifIcon = (type) => {
        switch (type) {
            case 'borrow_approved': return '✅';
            case 'borrow_rejected': return '❌';
            case 'borrow_returned': return '📦';
            case 'borrow_request': return '📋';
            default: return '🔔';
        }
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <button className={styles.menuBtn} onClick={onToggleSidebar}>
                    <Menu size={20} />
                </button>
                <div className={styles.searchBar}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาของ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

            <div className={styles.right}>
                {/* Theme Toggle */}
                <button
                    className={styles.iconBtn}
                    onClick={toggleTheme}
                    title="สลับธีม"
                >
                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* Notifications */}
                <div className={styles.notifWrapper} ref={notifRef}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <h3>การแจ้งเตือน</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {unreadCount > 0 && (
                                        <button
                                            className={styles.headerAction}
                                            onClick={markAllNotificationsRead}
                                            title="อ่านทั้งหมด"
                                        >
                                            <Check size={14} /> อ่านทั้งหมด
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            className={styles.headerAction}
                                            onClick={clearAllNotifications}
                                            title="ล้างทั้งหมด"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className={styles.notifList}>
                                {notifications.length === 0 ? (
                                    <div className={styles.emptyNotif}>
                                        <Bell size={32} style={{ opacity: 0.3 }} />
                                        <p>ไม่มีการแจ้งเตือน</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 20).map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`${styles.notifItem} ${!notif.read ? styles.unread : ''}`}
                                            onClick={() => handleNotifClick(notif)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.notifIcon}>
                                                {getNotifIcon(notif.type)}
                                            </div>
                                            <div className={styles.notifContent}>
                                                <p className={styles.notifTitle}>{notif.title}</p>
                                                <p className={styles.notifMsg}>{notif.message}</p>
                                                <span className={styles.notifTime}>{formatTime(notif.createdAt)}</span>
                                            </div>
                                            {!notif.read && <div className={`${styles.notifDot} ${styles.active}`} />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className={styles.userWrapper} ref={userRef}>
                    <button
                        className={styles.userBtn}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="avatar avatar-sm" style={user?.avatar ? { background: `url(${user.avatar}) center/cover no-repeat` } : {}}>
                            {!user?.avatar && getInitials(user?.name)}
                        </div>
                        <span className={styles.userName}>{user?.name}</span>
                    </button>

                    {showUserMenu && (
                        <div className={styles.dropdown}>
                            <Link
                                href="/profile"
                                className={styles.dropdownItem}
                                onClick={() => setShowUserMenu(false)}
                            >
                                <User size={16} />
                                <span>โปรไฟล์</span>
                            </Link>
                            <Link
                                href="/settings"
                                className={styles.dropdownItem}
                                onClick={() => setShowUserMenu(false)}
                            >
                                <Settings size={16} />
                                <span>ตั้งค่า</span>
                            </Link>
                            <div className={styles.divider} />
                            <button
                                className={styles.dropdownItem}
                                onClick={() => { logout(); setShowUserMenu(false); }}
                            >
                                <LogOut size={16} />
                                <span>ออกจากระบบ</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
