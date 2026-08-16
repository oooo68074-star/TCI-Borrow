'use client';

import Link from 'next/link';
import {
    Package, Users, ArrowLeftRight, TrendingUp,
    CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function AdminDashboard() {
    const { items, borrows } = useData();

    const totalItems = items.length;
    const availableItems = items.filter(i => i.status === 'available').length;
    const borrowedItems = items.filter(i => i.status === 'borrowed').length;
    const totalBorrows = borrows.length;
    const pendingBorrows = borrows.filter(b => b.status === 'pending');
    const activeBorrows = borrows.filter(b => b.status === 'active');

    const recentBorrows = [...borrows]
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
        .slice(0, 5);

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'กำลังยืม', class: 'badge-borrowed' },
            pending: { label: 'รออนุมัติ', class: 'badge-pending' },
            returned: { label: 'คืนแล้ว', class: 'badge-available' },
            rejected: { label: 'ปฏิเสธ', class: 'badge-unavailable' },
        };
        return map[status] || { label: status, class: '' };
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>แดชบอร์ดผู้ดูแล 🔒</h1>
                <p>ภาพรวมระบบยืม-คืนทั้งหมด</p>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                        <Package size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{totalItems}</span>
                        <span className={styles.statLabel}>ของทั้งหมด</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                        <CheckCircle2 size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{availableItems}</span>
                        <span className={styles.statLabel}>พร้อมให้ยืม</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconOrange}`}>
                        <Clock size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{pendingBorrows.length}</span>
                        <span className={styles.statLabel}>รออนุมัติ</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                        <ArrowLeftRight size={22} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>{activeBorrows.length}</span>
                        <span className={styles.statLabel}>กำลังถูกยืม</span>
                    </div>
                </div>
            </div>

            <div className={styles.gridTwo}>
                {/* Pending Requests */}
                <div className={`card ${styles.sectionCard}`}>
                    <div className={styles.sectionHeader}>
                        <h2>⏳ คำขอรออนุมัติ ({pendingBorrows.length})</h2>
                        <Link href="/admin/borrows" className={styles.seeAll}>
                            จัดการ <ChevronRight size={16} />
                        </Link>
                    </div>
                    {pendingBorrows.length === 0 ? (
                        <p className={styles.emptyText}>ไม่มีคำขอรออนุมัติ ✅</p>
                    ) : (
                        <div className={styles.requestList}>
                            {pendingBorrows.slice(0, 5).map(borrow => {
                                const item = items.find(i => i.id === borrow.itemId);
                                return (
                                    <div key={borrow.id} className={styles.requestItem}>
                                        <div className="avatar avatar-sm">{borrow.borrowerName?.[0]}</div>
                                        <div className={styles.requestInfo}>
                                            <p><strong>{borrow.borrowerName}</strong></p>
                                            <span>ขอยืม {item?.name || borrow.itemName}</span>
                                        </div>
                                        <span className="badge badge-pending">รอ</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className={`card ${styles.sectionCard}`}>
                    <div className={styles.sectionHeader}>
                        <h2>🕐 กิจกรรมล่าสุด</h2>
                    </div>
                    <div className={styles.requestList}>
                        {recentBorrows.map(borrow => {
                            const badge = getStatusBadge(borrow.status);
                            return (
                                <div key={borrow.id} className={styles.requestItem}>
                                    <div className="avatar avatar-sm">{borrow.borrowerName?.[0]}</div>
                                    <div className={styles.requestInfo}>
                                        <p><strong>{borrow.borrowerName}</strong></p>
                                        <span>
                                            {new Date(borrow.borrowDate).toLocaleDateString('th-TH', {
                                                day: 'numeric', month: 'short'
                                            })}
                                        </span>
                                    </div>
                                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
