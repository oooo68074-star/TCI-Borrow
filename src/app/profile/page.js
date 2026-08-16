'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Building, Hash,
    Edit3, Save, Package, ArrowLeftRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const { borrows } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(user || {});

    // Sync state when user context loads
    useEffect(() => {
        if (user) setUserData(user);
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsEditing(false);
        await updateProfile(userData);
    };

    const totalBorrowed = borrows.filter(b => b.borrowerId === user?.id).length;
    const totalLent = borrows.filter(b => b.ownerId === user?.id).length;
    const activeBorrows = borrows.filter(b => b.borrowerId === user?.id && b.status === 'active').length;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>โปรไฟล์</h1>
                <p>จัดการข้อมูลส่วนตัวของคุณ</p>
            </div>

            <div className={styles.profileGrid}>
                {/* Profile Card */}
                <div className={`card ${styles.profileCard}`}>
                    <div className={styles.profileBanner}>
                        <div className={styles.bannerGradient} />
                    </div>
                    <div className={styles.profileMain}>
                        <div className="avatar avatar-xl">
                            {userData.name?.[0] || '?'}
                        </div>
                        <h2>{userData.name}</h2>
                        <p className={styles.email}>{userData.email}</p>
                        <p className={styles.department}>{userData.department}</p>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <Package size={18} />
                            <div>
                                <span className={styles.statNum}>{totalLent}</span>
                                <span className={styles.statLabel}>ให้ยืม</span>
                            </div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <ArrowLeftRight size={18} />
                            <div>
                                <span className={styles.statNum}>{totalBorrowed}</span>
                                <span className={styles.statLabel}>ยืม</span>
                            </div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <CheckCircle2 size={18} />
                            <div>
                                <span className={styles.statNum}>{activeBorrows}</span>
                                <span className={styles.statLabel}>กำลังยืม</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className={`card ${styles.editCard}`}>
                    <div className={styles.editHeader}>
                        <h2>ข้อมูลส่วนตัว</h2>
                        <button
                            className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                        >
                            {isEditing ? <><Save size={16} /> บันทึก</> : <><Edit3 size={16} /> แก้ไข</>}
                        </button>
                    </div>

                    <div className={styles.formFields}>
                        <div className={styles.fieldItem}>
                            <div className={styles.fieldIcon}>
                                <User size={18} />
                            </div>
                            <div className={styles.fieldContent}>
                                <label>ชื่อ-นามสกุล</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={userData.name}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <p>{userData.name}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.fieldItem}>
                            <div className={styles.fieldIcon}>
                                <Mail size={18} />
                            </div>
                            <div className={styles.fieldContent}>
                                <label>อีเมล</label>
                                <p>{userData.email}</p>
                            </div>
                        </div>

                        <div className={styles.fieldItem}>
                            <div className={styles.fieldIcon}>
                                <Phone size={18} />
                            </div>
                            <div className={styles.fieldContent}>
                                <label>เบอร์โทร</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={userData.phone}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <p>{userData.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.fieldItem}>
                            <div className={styles.fieldIcon}>
                                <Building size={18} />
                            </div>
                            <div className={styles.fieldContent}>
                                <label>สาขา/คณะ</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="department"
                                        value={userData.department}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <p>{userData.department}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.fieldItem}>
                            <div className={styles.fieldIcon}>
                                <Hash size={18} />
                            </div>
                            <div className={styles.fieldContent}>
                                <label>รหัสนักศึกษา</label>
                                <p>{userData.studentId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
