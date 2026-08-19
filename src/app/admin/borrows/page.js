'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Package, User, Calendar, Download } from 'lucide-react';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

const tabs = [
    { id: 'pending', label: 'รออนุมัติ' },
    { id: 'active', label: 'กำลังยืม' },
    { id: 'returned', label: 'คืนแล้ว' },
    { id: 'rejected', label: 'ปฏิเสธ' },
    { id: 'all', label: 'ทั้งหมด' },
];

export default function AdminBorrowsPage() {
    const { borrows, items, updateBorrowStatus } = useData();
    const [activeTab, setActiveTab] = useState('pending');

    const filtered = activeTab === 'all'
        ? borrows
        : borrows.filter(b => b.status === activeTab);

    const handleApprove = (id) => {
        updateBorrowStatus(id, 'active');
    };

    const handleReject = (id) => {
        updateBorrowStatus(id, 'rejected');
    };

    const handleReturn = (id) => {
        updateBorrowStatus(id, 'returned');
    };

    const formatDate = (str) => {
        if (!str) return '-';
        return new Date(str).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'กำลังยืม', class: 'badge-borrowed' },
            pending: { label: 'รออนุมัติ', class: 'badge-pending' },
            returned: { label: 'คืนแล้ว', class: 'badge-available' },
            rejected: { label: 'ปฏิเสธ', class: 'badge-unavailable' },
        };
        return map[status] || { label: status, class: '' };
    };

    const exportToCSV = () => {
        const headers = ['รหัสรายการยืม', 'ชื่อของ', 'ผู้ยืม', 'เจ้าของ', 'วันที่ยืม', 'กำหนดคืน', 'วันที่คืน', 'สถานะ'];
        const rows = borrows.map(b => {
            const row = [
                b.id,
                b.itemName || '-',
                b.borrowerName || '-',
                b.ownerName || '-',
                b.borrowDate ? new Date(b.borrowDate).toISOString().split('T')[0] : '-',
                b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : '-',
                b.returnDate ? new Date(b.returnDate).toISOString().split('T')[0] : '-',
                b.status
            ];
            return row.map(field => `"${field}"`).join(',');
        });

        // Add UTF-8 BOM for Thai encoding in Excel
        const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `borrow_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>จัดการคำขอยืม</h1>
                    <p>อนุมัติ ปฏิเสธ และติดตามสถานะการยืม-คืน</p>
                </div>
                <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Download size={18} /> ออกรายงาน (CSV)
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => {
                    const count = tab.id === 'all' ? borrows.length : borrows.filter(b => b.status === tab.id).length;
                    return (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            <span className={styles.tabCount}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Borrows List */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <Package size={64} />
                    <h3>ไม่มีรายการ</h3>
                    <p>ไม่มีคำขอในหมวดนี้</p>
                </div>
            ) : (
                <div className={styles.borrowsList}>
                    {filtered.map((borrow, index) => {
                        const item = items.find(i => i.id === borrow.itemId);
                        const badge = getStatusBadge(borrow.status);
                        return (
                            <div
                                key={borrow.id}
                                className={`card ${styles.borrowCard}`}
                                style={{ animationDelay: `${index * 0.04}s` }}
                            >
                                <div className={styles.borrowTop}>
                                    <div className={styles.borrowImage}>
                                        {item?.image ? (
                                            <img src={item.image} alt={item?.name} />
                                        ) : (
                                            <span>📦</span>
                                        )}
                                    </div>
                                    <div className={styles.borrowInfo}>
                                        <h3>{item?.name || borrow.itemName}</h3>
                                        <div className={styles.metaRow}>
                                            <span><User size={14} /> {borrow.borrowerName}</span>
                                            <span><Calendar size={14} /> {formatDate(borrow.borrowDate)}</span>
                                            {borrow.status === 'active' && borrow.dueDate && (() => {
                                                const isOverdue = new Date(borrow.dueDate) < new Date();
                                                return (
                                                    <span className={isOverdue ? styles.overdueText : styles.dueText}>
                                                        {isOverdue ? '⚠️ เลยกำหนด:' : '⌛ กำหนด:'} {formatDate(borrow.dueDate)}
                                                    </span>
                                                );
                                            })()}
                                            {borrow.note && <span>💬 {borrow.note}</span>}
                                        </div>
                                    </div>
                                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                                </div>

                                {/* Action Buttons */}
                                {borrow.status === 'pending' && (
                                    <div className={styles.actions}>
                                        <button
                                            className={`btn btn-primary ${styles.approveBtn}`}
                                            onClick={() => handleApprove(borrow.id)}
                                        >
                                            <CheckCircle2 size={16} /> อนุมัติ
                                        </button>
                                        <button
                                            className={`btn btn-secondary ${styles.rejectBtn}`}
                                            onClick={() => handleReject(borrow.id)}
                                        >
                                            <XCircle size={16} /> ปฏิเสธ
                                        </button>
                                    </div>
                                )}

                                {borrow.status === 'active' && (
                                    <div className={styles.actions}>
                                        <button
                                            className={`btn btn-secondary ${styles.returnBtn}`}
                                            onClick={() => handleReturn(borrow.id)}
                                        >
                                            <Package size={16} /> รับคืน
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
