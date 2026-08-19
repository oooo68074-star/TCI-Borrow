'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userData = await login(email, password);
            // Delay navigation to avoid Next.js router initialization issue
            setTimeout(() => {
                router.push(userData?.role === 'admin' ? '/admin' : '/');
            }, 100);
        } catch (err) {
            console.error('Login error:', err);
            const code = err?.code || '';
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            } else if (code === 'auth/too-many-requests') {
                setError('ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่');
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
                    <p>เข้าสู่ระบบเพื่อจัดการการยืม-คืน</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={`input-group ${styles.inputGroup}`}>
                        <label>อีเมล</label>
                        <div className="input-icon">
                            <Mail size={18} />
                            <input
                                type="email"
                                inputMode="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                className="input-field"
                                placeholder="your@university.ac.th"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={`input-group ${styles.inputGroup}`}>
                        <label>รหัสผ่าน</label>
                        <div className="input-icon">
                            <Lock size={18} />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                            <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ลืมรหัสผ่าน?</Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                        disabled={loading}
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <p className={styles.authFooter}>
                    ยังไม่มีบัญชี? <Link href="/register">สมัครสมาชิก</Link>
                </p>
            </div>
        </div>
    );
}
