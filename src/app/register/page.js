'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
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
            await register(formData.name, formData.email, formData.password);
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

    return (
        <div className={styles.authPage}>
            <div className={styles.bgEffect}>
                <div className={styles.bgOrb1} />
                <div className={styles.bgOrb2} />
                <div className={styles.bgOrb3} />
            </div>

            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <div className={styles.logoIcon}>
                        <Sparkles size={28} />
                    </div>
                    <h1>สมัครสมาชิก</h1>
                    <p>สร้างบัญชีเพื่อเริ่มใช้งาน BorrowHub</p>
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
