'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { login, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
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

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            const userData = await signInWithGoogle();
            setTimeout(() => {
                router.push(userData?.role === 'admin' ? '/admin' : '/');
            }, 100);
        } catch (err) {
            console.error('Google sign-in error:', err);
            const code = err?.code || '';
            if (code === 'auth/popup-closed-by-user') {
                // User closed the popup, no need to show error
                return;
            } else if (code === 'auth/cancelled-popup-request') {
                return;
            } else {
                setError(`เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google: ${err.message || 'กรุณาลองใหม่'}`);
            }
        } finally {
            setGoogleLoading(false);
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

                <div className={styles.divider}>
                    <span>หรือ</span>
                </div>

                <button
                    type="button"
                    className={styles.googleBtn}
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                >
                    {googleLoading ? (
                        <span className={styles.googleSpinner} />
                    ) : (
                        <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    )}
                    {googleLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
                </button>

                <p className={styles.authFooter}>
                    ยังไม่มีบัญชี? <Link href="/register">สมัครสมาชิก</Link>
                </p>
            </div>
        </div>
    );
}
