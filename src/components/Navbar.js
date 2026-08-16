'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Search, Bell, Menu, X, LogOut, User, Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar({ onToggleSidebar }) {
    const { user, logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const notifRef = useRef(null);
    const userRef = useRef(null);
    const pathname = usePathname();

    // Notifications will come from Firestore in the future
    const notifications = [];
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

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2);
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'เมื่อสักครู่';
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        const days = Math.floor(hours / 24);
        return `${days} วันที่แล้ว`;
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
                    />
                </div>
            </div>

            <div className={styles.right}>
                {/* Notifications */}
                <div className={styles.notifWrapper} ref={notifRef}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className={styles.badge}>{unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <h3>การแจ้งเตือน</h3>
                                <span className={styles.unreadBadge}>{unreadCount} ใหม่</span>
                            </div>
                            <div className={styles.notifList}>
                                {notifications.map(notif => (
                                    <Link
                                        key={notif.id}
                                        href={notif.link}
                                        className={`${styles.notifItem} ${!notif.read ? styles.unread : ''}`}
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        <div className={`${styles.notifDot} ${!notif.read ? styles.active : ''}`} />
                                        <div>
                                            <p className={styles.notifTitle}>{notif.title}</p>
                                            <p className={styles.notifMsg}>{notif.message}</p>
                                            <span className={styles.notifTime}>{formatTime(notif.createdAt)}</span>
                                        </div>
                                    </Link>
                                ))}
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
                        <div className="avatar avatar-sm">
                            {getInitials(user?.name)}
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
