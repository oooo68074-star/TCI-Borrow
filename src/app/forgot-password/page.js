'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/page.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            console.error('Reset error:', err);
            const code = err.code || '';
            if (code === 'auth/invalid-email') {
                setError('รูปแบบอีเมลไม่ถูกต้อง');
            } else if (code === 'auth/user-not-found') {
                setError('ไม่พบบัญชีที่ใช้อีเมลนี้');
            } else {
                setError(`เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.bgEffect}>
                <div className={styles.bgOrb1} />
                <div className={styles.bgOrb2} />
                <div className={styles.bgOrb3} />
            </div>

            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <img src="/logo.png" alt="TCIMCRU Logo" style={{ width: '240px', height: 'auto', marginBottom: '16px', display: 'inline-block' }} />
                    <h1>รีเซ็ตรหัสผ่าน</h1>
                    <p>กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ต</p>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        {error && <div className={styles.error}>{error}</div>}

                        <div className={`input-group ${styles.inputGroup}`}>
                            <label>อีเมล</label>
                            <div className="input-icon">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="your@university.ac.th"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                            disabled={loading}
                        >
                            {loading ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์รีเซ็ต'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', margin: '24px 0' }}>
                        <div style={{ color: 'var(--success)', marginBottom: '16px', fontWeight: '500', fontSize: '0.95rem' }}>
                            ✅ ลิงก์สำหรับรีเซ็ตรหัสผ่านถูกส่งไปยังอีเมล <strong>{email}</strong> แล้ว <br /><br />
                            กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์ Junk/Spam)
                        </div>
                    </div>
                )}

                <p className={styles.authFooter} style={{ marginTop: '24px' }}>
                    <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <ArrowLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </p>
            </div>
        </div>
    );
}
