'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Contact } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { register, signInWithGoogle } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        studentId: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (formData.password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password, formData.studentId);
            setTimeout(() => {
                router.push('/');
            }, 100);
        } catch (err) {
            console.error('Register error:', err);
            const code = err?.code || '';
            if (code === 'auth/email-already-in-use') {
                setError('อีเมลนี้ถูกใช้ไปแล้ว');
            } else if (code === 'auth/weak-password') {
                setError('รหัสผ่านอ่อนแรงเกินไป กรุณาใช้อย่างน้อย 6 ตัวอักษร');
            } else if (code === 'auth/invalid-email') {
                setError('รูปแบบอีเมลไม่ถูกต้อง');
            } else {
                setError(`เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            setTimeout(() => {
                router.push('/');
            }, 100);
        } catch (err) {
            console.error('Google sign-up error:', err);
            const code = err?.code || '';
            if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                return;
            } else {
                setError(`เกิดข้อผิดพลาดในการสมัครด้วย Google: ${err.message || 'กรุณาลองใหม่'}`);
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
                    <h1>สมัครสมาชิก</h1>
                    <p>สร้างบัญชีเพื่อเริ่มใช้งาน TCIMCRU</p>
                </div>

                <button
                    type="button"
                    className={styles.googleBtn}
                    onClick={handleGoogleSignUp}
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
                    {googleLoading ? 'กำลังสมัคร...' : 'สมัครด้วย Google'}
                </button>

                <div className={styles.divider}>
                    <span>หรือสมัครด้วยอีเมล</span>
                </div>

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={`input-group ${styles.inputGroup}`}>
                        <label>ชื่อ-นามสกุล</label>
                        <div className="input-icon">
                            <User size={18} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="ชื่อ นามสกุล"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={`input-group ${styles.inputGroup}`}>
                        <label>รหัสนักศึกษา</label>
                        <div className="input-icon">
                            <Contact size={18} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="รหัสนักศึกษา (เช่น 6500001)"
                                name="studentId"
                                value={formData.studentId}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={`input-group ${styles.inputGroup}`}>
                        <label>อีเมล</label>
                        <div className="input-icon">
                            <Mail size={18} />
                            <input
                                type="email"
                                className="input-field"
                                placeholder="your@university.ac.th"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
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
                                placeholder="อย่างน้อย 6 ตัวอักษร"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className={`input-group ${styles.inputGroup}`}>
                        <label>ยืนยันรหัสผ่าน</label>
                        <div className="input-icon">
                            <Lock size={18} />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="กรอกรหัสผ่านอีกครั้ง"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                        disabled={loading}
                    >
                        {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <p className={styles.authFooter}>
                    มีบัญชีอยู่แล้ว? <Link href="/login">เข้าสู่ระบบ</Link>
                </p>
            </div>
        </div>
    );
}
