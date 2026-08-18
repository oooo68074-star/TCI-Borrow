'use client';

import { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, Building, Hash,
    Edit3, Save, Package, ArrowLeftRight, CheckCircle2, Camera
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const { borrows } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(user || {});
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Sync state when user context loads
    useEffect(() => {
        if (user) setUserData(user);
    }, [user]);

    const compressImageToBase64 = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400; // Profile pics can be small
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handleAvatarChange = async (e) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploadingAvatar(true);
        try {
            const file = e.target.files[0];
            const base64 = await compressImageToBase64(file);
            setUserData(prev => ({ ...prev, avatar: base64 }));
        } catch (error) {
            console.error("Avatar error:", error);
        } finally {
            setUploadingAvatar(false);
        }
    };

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
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div
                                className="avatar avatar-xl"
                                style={{
                                    border: '4px solid var(--bg-card)',
                                    ...(userData.avatar ? { background: `url(${userData.avatar}) center/cover no-repeat` } : {})
                                }}
                            >
                                {!userData.avatar && (userData.name?.[0] || '?')}
                            </div>
                            {isEditing && (
                                <button className={styles.avatarEditBtn} onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                                    <Camera size={16} />
                                </button>
                            )}
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} hidden onChange={handleAvatarChange} />

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
                                <Hash size={18} />
                            </div>
                            <div className={styles.fieldContent}>
                                <label>รหัสนักศึกษา</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="studentId"
                                        value={userData.studentId || ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <p>{userData.studentId || '-'}</p>
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
