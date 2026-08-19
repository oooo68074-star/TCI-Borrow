'use client';

import Link from 'next/link';
import {
    Package, Users, ArrowLeftRight, TrendingUp,
    CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function AdminDashboard() {
    const { items, borrows, isLoaded } = useData();

    if (!isLoaded) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <div className="skeleton-glass skeleton-title" style={{ width: '35%' }}></div>
                    <div className="skeleton-glass skeleton-text" style={{ width: '45%' }}></div>
                </div>
                <div className={styles.statsGrid}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-glass skeleton-card"></div>)}
                </div>
                <div className={styles.recentSection} style={{ marginTop: '32px' }}>
                    <div className="skeleton-glass skeleton-title" style={{ width: '20%' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-glass" style={{ height: '80px', borderRadius: '12px' }}></div>)}
                    </div>
                </div>
            </div>
        );
    }

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

    // Calculate last 7 days chart data
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const chartData = last7Days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = borrows.filter(b => {
            if (!b.borrowDate) return false;
            const bDate = new Date(b.borrowDate);
            return bDate >= date && bDate < nextDay;
        }).length;

        return {
            label: date.toLocaleDateString('th-TH', { weekday: 'short' }),
            count,
        };
    });

    const maxCount = Math.max(...chartData.map(d => d.count), 5); // default base height max

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

            {/* Dashboard Analytics Chart */}
            <div className={`card ${styles.chartCard}`}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>📉 สถิติการยืม (7 วันล่าสุด)</h3>
                <div className={styles.chartContainer}>
                    {chartData.map((data, index) => {
                        const heightPercent = (data.count / maxCount) * 100;
                        return (
                            <div key={index} className={styles.barCol}>
                                <div className={styles.barTooltip}>{data.count} รายการ</div>
                                <div className={styles.barTrack}>
                                    <div
                                        className={styles.barFill}
                                        style={{ height: `${heightPercent}%`, animationDelay: `${index * 0.1}s` }}
                                    ></div>
                                </div>
                                <div className={styles.barLabel}>{data.label}</div>
                            </div>
                        );
                    })}
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
