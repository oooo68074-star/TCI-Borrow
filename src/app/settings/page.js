'use client';

import { useState } from 'react';
import {
    Bell, Lock, Shield, Trash2, CheckCircle2, AlertTriangle, Moon, Sun
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import styles from './page.module.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { clearAllNotifications } = useData();
    const { theme, toggleTheme } = useTheme();

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

    // Password change
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const toggleSetting = (key) => {
        const updated = { ...settings, [key]: !settings[key] };
        setSettings(updated);
        localStorage.setItem('borrowhub_settings', JSON.stringify(updated));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        setChangingPassword(true);

        try {
            const firebaseUser = auth.currentUser;
            const credential = EmailAuthProvider.credential(firebaseUser.email, passwordForm.currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, passwordForm.newPassword);

            setPasswordSuccess('เปลี่ยนรหัสผ่านสำเร็จ!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err) {
            console.error("Password change error:", err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setPasswordError('รหัสผ่านเดิมไม่ถูกต้อง');
            } else if (err.code === 'auth/weak-password') {
                setPasswordError('รหัสผ่านไม่ปลอดภัยเพียงพอ');
            } else {
                setPasswordError(`เกิดข้อผิดพลาด: ${err.message}`);
            }
        } finally {
            setChangingPassword(false);
        }
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

                {/* Password */}
                <div className={`card ${styles.settingsSection}`}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIcon}>
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2>เปลี่ยนรหัสผ่าน</h2>
                            <p>อัปเดตรหัสผ่านเพื่อความปลอดภัย</p>
                        </div>
                    </div>

                    {passwordSuccess && (
                        <div className={styles.successMsg}>
                            <CheckCircle2 size={16} /> {passwordSuccess}
                        </div>
                    )}
                    {passwordError && (
                        <div className={styles.errorMsg}>
                            <AlertTriangle size={16} /> {passwordError}
                        </div>
                    )}

                    <form className={styles.passwordForm} onSubmit={handlePasswordChange}>
                        <div className="input-group">
                            <label>รหัสผ่านเดิม</label>
                            <input
                                type="password"
                                className="input-field"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>รหัสผ่านใหม่</label>
                            <input
                                type="password"
                                className="input-field"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="อย่างน้อย 6 ตัวอักษร"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>ยืนยันรหัสผ่านใหม่</label>
                            <input
                                type="password"
                                className="input-field"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={changingPassword}
                        >
                            {changingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                        </button>
                    </form>
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
