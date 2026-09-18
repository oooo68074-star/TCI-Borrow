'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, User, Search, ShieldCheck,
    ShieldAlert, AlertTriangle, CheckCircle2, ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function AdminUsersPage() {
    const router = useRouter();
    const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
    const { borrows } = useData();

    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');

    // Role modal states
    const [modalUser, setModalUser] = useState(null);
    const [targetRole, setTargetRole] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // Fetch all users in real-time
    useEffect(() => {
        if (!isAdmin && !authLoading) return;

        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const list = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            // Sort by createdAt descending
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setUsersList(list);
            setLoadingUsers(false);
        }, (err) => {
            console.error("Error fetching users:", err);
            setLoadingUsers(false);
        });

        return () => unsubscribe();
    }, [isAdmin, authLoading]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        return usersList.filter(u => {
            const q = searchQuery.toLowerCase();
            const nameMatch = (u.name || '').toLowerCase().includes(q);
            const emailMatch = (u.email || '').toLowerCase().includes(q);
            const studentIdMatch = (u.studentId || '').toLowerCase().includes(q);
            const deptMatch = (u.department || '').toLowerCase().includes(q);
            const matchSearch = nameMatch || emailMatch || studentIdMatch || deptMatch;

            const matchRole = selectedRole === 'all' || u.role === selectedRole;
            return matchSearch && matchRole;
        });
    }, [usersList, searchQuery, selectedRole]);

    // Statistics
    const totalUsers = usersList.length;
    const totalAdmins = usersList.filter(u => u.role === 'admin').length;
    const totalRegular = totalUsers - totalAdmins;

    // Open confirmation modal
    const openRoleModal = (u, newRole) => {
        setModalUser(u);
        setTargetRole(newRole);
    };

    const closeRoleModal = () => {
        setModalUser(null);
        setTargetRole(null);
    };

    // Confirm Role Change
    const confirmRoleChange = async () => {
        if (!modalUser || !targetRole) return;
        setIsUpdating(true);
        setStatusMessage({ type: '', text: '' });

        try {
            await updateDoc(doc(db, 'users', modalUser.id), {
                role: targetRole
            });
            setStatusMessage({
                type: 'success',
                text: `ปรับสิทธิ์ ${modalUser.name || modalUser.email} เป็น ${targetRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป (User)'} สำเร็จ!`
            });
            closeRoleModal();
            setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            console.error("Error updating user role:", err);
            setStatusMessage({
                type: 'error',
                text: `เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์: ${err.message}`
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (authLoading || loadingUsers) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <div className="skeleton-glass skeleton-title" style={{ width: '30%' }} />
                    <div className="skeleton-glass skeleton-text" style={{ width: '50%' }} />
                </div>
                <div className={styles.statsGrid}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-glass skeleton-card" style={{ height: '90px' }} />)}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <ShieldAlert size={64} style={{ color: 'var(--danger)' }} />
                    <h2>ปฏิเสธการเข้าถึง</h2>
                    <p>หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
                    <button className="btn btn-primary" onClick={() => router.push('/')} style={{ marginTop: '16px' }}>
                        กลับหน้าหลัก
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>จัดการสมาชิกและสิทธิ์ 👥</h1>
                    <p>ดูรายชื่อผู้ใช้งานในระบบ กำหนดสิทธิ์ Admin หรือ User</p>
                </div>
            </div>

            {/* Status notification banner */}
            {statusMessage.text && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: statusMessage.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{totalUsers}</span>
                        <span className={styles.statLabel}>สมาชิกทั้งหมด</span>
                    </div>
                </div>

                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                        <ShieldCheck size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{totalAdmins}</span>
                        <span className={styles.statLabel}>ผู้ดูแลระบบ (Admin)</span>
                    </div>
                </div>

                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                        <User size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{totalRegular}</span>
                        <span className={styles.statLabel}>สมาชิกทั่วไป (User)</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาตามชื่อ, อีเมล, รหัสนักศึกษา หรือแผนก..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className={`input-field ${styles.roleSelect}`}
                >
                    <option value="all">ทุกสิทธิ์ ({totalUsers})</option>
                    <option value="admin">เฉพาะผู้ดูแลระบบ ({totalAdmins})</option>
                    <option value="user">เฉพาะสมาชิกทั่วไป ({totalRegular})</option>
                </select>
            </div>

            {/* Users Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>สมาชิก</th>
                                <th>รหัสนักศึกษา / แผนก</th>
                                <th>เบอร์โทร</th>
                                <th>สิทธิ์การใช้งาน</th>
                                <th>ประวัติยืม</th>
                                <th>วันที่สมัคร</th>
                                <th>จัดการสิทธิ์</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                                        <Users size={32} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>ไม่พบข้อมูลสมาชิกที่ค้นหา</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const userBorrowsCount = borrows.filter(b => b.borrowerId === u.id).length;
                                    const isSelf = u.id === currentUser?.id;
                                    const isTargetAdmin = u.role === 'admin';

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <div className={styles.avatar}>
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt={u.name} />
                                                        ) : (
                                                            (u.name || 'U').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={styles.userName}>
                                                            {u.name || 'ไม่ระบุชื่อ'}
                                                            {isSelf && (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginLeft: '6px' }}>(คุณ)</span>
                                                            )}
                                                        </p>
                                                        <p className={styles.userEmail}>{u.email || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <div>{u.studentId || '-'}</div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{u.department || 'ไม่ระบุแผนก'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.85rem' }}>{u.phone || '-'}</span>
                                            </td>
                                            <td>
                                                {isTargetAdmin ? (
                                                    <span className={styles.badgeAdmin}>
                                                        <Shield size={12} /> Admin
                                                    </span>
                                                ) : (
                                                    <span className={styles.badgeUser}>
                                                        <User size={12} /> User
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={styles.borrowBadge}>
                                                    <ArrowLeftRight size={13} /> {userBorrowsCount} ครั้ง
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '-'}
                                                </span>
                                            </td>
                                            <td>
                                                {isTargetAdmin ? (
                                                    <button
                                                        className={`btn btn-secondary ${styles.actionBtn}`}
                                                        onClick={() => openRoleModal(u, 'user')}
                                                        title="ปรับเป็นสมาชิกทั่วไป"
                                                    >
                                                        <User size={14} /> ปรับเป็น User
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={`btn btn-primary ${styles.actionBtn}`}
                                                        onClick={() => openRoleModal(u, 'admin')}
                                                        title="แต่งตั้งเป็นผู้ดูแลระบบ"
                                                    >
                                                        <Shield size={14} /> แต่งตั้ง Admin
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {modalUser && (
                <div className="modal-overlay" onClick={closeRoleModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={`${styles.modalIcon} ${targetRole === 'admin' ? styles.modalIconAdmin : styles.modalIconUser}`}>
                            {targetRole === 'admin' ? <ShieldCheck size={32} /> : <User size={32} />}
                        </div>

                        <h2>
                            {targetRole === 'admin' ? 'แต่งตั้งเป็นผู้ดูแลระบบ (Admin)' : 'ปรับเป็นสมาชิกทั่วไป (User)'}
                        </h2>

                        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 20px', fontSize: '0.9rem' }}>
                            คุณต้องการเปลี่ยนสิทธิ์ของ <strong>{modalUser.name || modalUser.email}</strong> เป็น{' '}
                            <strong>{targetRole === 'admin' ? 'Admin' : 'User'}</strong> ใช่หรือไม่?
                        </p>

                        {modalUser.id === currentUser?.id && targetRole === 'user' && (
                            <div style={{
                                padding: '10px 14px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                color: 'var(--danger)',
                                fontSize: '0.85rem',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textAlign: 'left'
                            }}>
                                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                                <span>คำเตือน: นี่คือบัญชีของคุณเอง หากปรับเป็น User คุณจะไม่สามารถเข้าถึงหน้าแอดมินได้อีก</span>
                            </div>
                        )}

                        <div className={styles.modalActions}>
                            <button className="btn btn-secondary" onClick={closeRoleModal} disabled={isUpdating}>
                                ยกเลิก
                            </button>
                            <button
                                className={targetRole === 'admin' ? 'btn btn-primary' : 'btn btn-outline'}
                                onClick={confirmRoleChange}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'กำลังบันทึก...' : 'ยืนยันเปลี่ยนสิทธิ์'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
