'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'active', label: 'กำลังยืม' },
    { id: 'pending', label: 'รออนุมัติ' },
    { id: 'returned', label: 'คืนแล้ว' },
    { id: 'rejected', label: 'ถูกปฏิเสธ' },
];

export default function MyBorrowsPage() {
    const { user } = useAuth();
    const { items: allItems, borrows } = useData();
    const [activeTab, setActiveTab] = useState('all');

    const myBorrows = borrows.filter(b => b.borrowerId === user?.id);
    const filtered = activeTab === 'all'
        ? myBorrows
        : myBorrows.filter(b => b.status === activeTab);

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'กำลังยืม', class: 'badge-borrowed', icon: <Package size={14} /> },
            pending: { label: 'รออนุมัติ', class: 'badge-pending', icon: <Clock size={14} /> },
            returned: { label: 'คืนแล้ว', class: 'badge-available', icon: <CheckCircle2 size={14} /> },
            rejected: { label: 'ถูกปฏิเสธ', class: 'badge-unavailable', icon: <XCircle size={14} /> },
        };
        return map[status] || { label: status, class: '', icon: null };
    };

    const formatDate = (str) => {
        if (!str) return '-';
        return new Date(str).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>รายการยืมของฉัน</h1>
                <p>ติดตามสถานะคำขอยืมและของที่กำลังยืมอยู่</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.id !== 'all' && (
                            <span className={styles.tabCount}>
                                {myBorrows.filter(b => b.status === tab.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Borrows List */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Package size={64} />
                    <h3>ไม่มีรายการ</h3>
                    <p>ยังไม่มีรายการยืมในหมวดนี้</p>
                    <Link href="/items" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        ค้นหาของยืม
                    </Link>
                </div>
            ) : (
                <div className={styles.borrowsList}>
                    {filtered.map((borrow, index) => {
                        const item = allItems.find(i => i.id === borrow.itemId);
                        const badge = getStatusBadge(borrow.status);
                        return (
                            <Link
                                key={borrow.id}
                                href={`/items/${borrow.itemId}`}
                                className={`card ${styles.borrowCard}`}
                                style={{ animationDelay: `${index * 0.04}s` }}
                            >
                                <div className={styles.borrowImage}>
                                    {item?.image ? (
                                        <img src={item.image} alt={item?.name} />
                                    ) : (
                                        <span>📦</span>
                                    )}
                                </div>
                                <div className={styles.borrowInfo}>
                                    <h3>{item?.name || borrow.itemName}</h3>
                                    <p className={styles.ownerText}>เจ้าของ: {borrow.ownerName}</p>
                                    <div className={styles.dateRow}>
                                        <span>ยืม: {formatDate(borrow.borrowDate)}</span>
                                        {borrow.returnDate && (
                                            <span>คืน: {formatDate(borrow.returnDate)}</span>
                                        )}
                                        {borrow.status === 'active' && borrow.dueDate && (() => {
                                            const isOverdue = new Date(borrow.dueDate) < new Date();
                                            return (
                                                <span className={`${styles.dueBadge} ${isOverdue ? styles.overdue : ''}`}>
                                                    <AlertCircle size={12} />
                                                    {isOverdue ? 'เลยกำหนดคืน:' : 'กำหนดคืน:'} {formatDate(borrow.dueDate)}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <span className={`badge ${badge.class} ${styles.statusBadge}`}>
                                    {badge.icon} {badge.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
