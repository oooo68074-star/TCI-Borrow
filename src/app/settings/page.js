'use client';

import { useState } from 'react';
import {
    Bell, Shield, Trash2, CheckCircle2, AlertTriangle, Moon, Sun
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './page.module.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { clearAllNotifications } = useData();
    const { theme, toggleTheme, glassOpacity, changeGlassOpacity } = useTheme();

    // Notification preferences (stored locally for now)
    const [settings, setSettings] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('borrowhub_settings');
            return saved ? JSON.parse(saved) : {
                notifBorrowApproved: true,
                notifBorrowRejected: true,
                notifNewRequest: true,
                notifReturned: true,
            };
        }
        return {
            notifBorrowApproved: true,
            notifBorrowRejected: true,
            notifNewRequest: true,
            notifReturned: true,
        };
    });

    const toggleSetting = (key) => {
        const updated = { ...settings, [key]: !settings[key] };
        setSettings(updated);
        localStorage.setItem('borrowhub_settings', JSON.stringify(updated));
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>ตั้งค่า</h1>
                <p>จัดการการตั้งค่าและความเป็นส่วนตัวของคุณ</p>
            </div>

            <div className={styles.settingsGrid}>
                {/* Theme Settings */}
                <div className={`card ${styles.settingsSection}`}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <div>
                            <h2>ธีมการแสดงผล</h2>
                            <p>สลับระหว่างโหมดมืด (Dark) และ โหมดสว่าง (Light)</p>
                        </div>
                    </div>
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>โหมดสว่าง (Light Mode)</h3>
                            <p>ใช้งานธีมสว่างสำหรับสภาพแวดล้อมที่แสงเยอะ</p>
                        </div>
                        <div
                            className={`${styles.toggle} ${theme === 'light' ? styles.active : ''}`}
                            onClick={toggleTheme}
                        >
                            <div className={styles.toggleDot} />
                        </div>
                    </div>

                    <div className={styles.settingItem} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                        <div className={styles.settingInfo} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>ความโปร่งแสงของผิวกระจก (Liquid Glass)</h3>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                    {Math.round(glassOpacity * 100)}%
                                </span>
                            </div>
                            <p style={{ marginTop: '4px' }}>ปรับระดับความโปร่งใสของพื้นหลังการ์ดทั้งหมดในระบบ</p>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={glassOpacity}
                            onChange={(e) => changeGlassOpacity(parseFloat(e.target.value))}
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                                accentColor: 'var(--accent-primary)'
                            }}
                        />
                    </div>
                </div>

                {/* Notification Settings */}
                <div className={`card ${styles.settingsSection}`}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2>การแจ้งเตือน</h2>
                            <p>กำหนดประเภทการแจ้งเตือนที่ต้องการรับ</p>
                        </div>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>คำขอยืมอนุมัติแล้ว</h3>
                            <p>แจ้งเตือนเมื่อคำขอยืมของคุณได้รับการอนุมัติ</p>
                        </div>
                        <div
                            className={`${styles.toggle} ${settings.notifBorrowApproved ? styles.active : ''}`}
                            onClick={() => toggleSetting('notifBorrowApproved')}
                        >
                            <div className={styles.toggleDot} />
                        </div>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>คำขอยืมถูกปฏิเสธ</h3>
                            <p>แจ้งเตือนเมื่อคำขอยืมของคุณถูกปฏิเสธ</p>
                        </div>
                        <div
                            className={`${styles.toggle} ${settings.notifBorrowRejected ? styles.active : ''}`}
                            onClick={() => toggleSetting('notifBorrowRejected')}
                        >
                            <div className={styles.toggleDot} />
                        </div>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>คำขอยืมใหม่ (แอดมิน)</h3>
                            <p>แจ้งเตือนเมื่อมีผู้ใช้ส่งคำขอยืมใหม่</p>
                        </div>
                        <div
                            className={`${styles.toggle} ${settings.notifNewRequest ? styles.active : ''}`}
                            onClick={() => toggleSetting('notifNewRequest')}
                        >
                            <div className={styles.toggleDot} />
                        </div>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>รับคืนสำเร็จ</h3>
                            <p>แจ้งเตือนเมื่อของถูกรับคืนเรียบร้อย</p>
                        </div>
                        <div
                            className={`${styles.toggle} ${settings.notifReturned ? styles.active : ''}`}
                            onClick={() => toggleSetting('notifReturned')}
                        >
                            <div className={styles.toggleDot} />
                        </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={clearAllNotifications}
                        >
                            <Trash2 size={16} /> ล้างการแจ้งเตือนทั้งหมด
                        </button>
                    </div>
                </div>

                {/* Account Info */}
                <div className={`card ${styles.settingsSection}`}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2>ข้อมูลบัญชี</h2>
                            <p>ข้อมูลทั่วไปของบัญชีคุณ</p>
                        </div>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>อีเมล</h3>
                            <p>{user?.email}</p>
                        </div>
                    </div>
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>ชื่อ</h3>
                            <p>{user?.name}</p>
                        </div>
                    </div>
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>สิทธิ์</h3>
                            <p>{user?.role === 'admin' ? '🔒 ผู้ดูแลระบบ (Admin)' : '👤 ผู้ใช้ทั่วไป (User)'}</p>
                        </div>
                    </div>
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <h3>สมัครเมื่อ</h3>
                            <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                        </div>
                    </div>

                    <div className={styles.dangerZone} style={{ marginTop: '24px' }}>
                        <h3><AlertTriangle size={16} /> โซนอันตราย</h3>
                        <p>การออกจากระบบจะต้องล็อกอินใหม่ในครั้งถัดไป</p>
                        <button className="btn btn-secondary" onClick={logout} style={{ color: 'var(--danger)' }}>
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
