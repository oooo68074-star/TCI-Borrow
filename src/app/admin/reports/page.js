'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Download, AlertTriangle, Package, User, Calendar, TrendingUp } from 'lucide-react';
import styles from './page.module.css';

const tabs = [
    { id: 'overdue', label: 'เกินกำหนด' },
    { id: 'all_history', label: 'ประวัติทั้งหมด' },
    { id: 'top_items', label: 'อุปกรณ์ยอดฮิต' }
];

export default function AdminReportsPage() {
    const { borrows, items } = useData();
    const [activeTab, setActiveTab] = useState('overdue');

    const overdueBorrows = useMemo(() => {
        return borrows.filter(b => b.status === 'active' && b.dueDate && new Date(b.dueDate) < new Date());
    }, [borrows]);

    const topItems = useMemo(() => {
        const counts = {};
        borrows.forEach(b => {
            if (b.itemId) {
                counts[b.itemId] = (counts[b.itemId] || 0) + 1;
            }
        });
        
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .map(([itemId, count]) => {
                const item = items.find(i => i.id === itemId);
                return { item, count };
            })
            .filter(i => i.item)
            .slice(0, 10);
    }, [borrows, items]);

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
        const headers = ['รหัสรายการยืม', 'ชื่อของ', 'ผู้ยืม', 'วันที่ยืม', 'กำหนดคืน', 'วันที่คืน', 'สถานะ', 'หมายเหตุ'];
        
        const rows = (activeTab === 'overdue' ? overdueBorrows : borrows).map(b => {
            const row = [
                b.id,
                b.itemName || '-',
                b.borrowerName || '-',
                b.borrowDate ? new Date(b.borrowDate).toISOString().split('T')[0] : '-',
                b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : '-',
                b.returnDate ? new Date(b.returnDate).toISOString().split('T')[0] : '-',
                b.status,
                b.note || ''
            ];
            return row.map(field => `"${field}"`).join(',');
        });

        // Add UTF-8 BOM for Thai encoding in Excel
        const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const fileName = activeTab === 'overdue' ? 'overdue_report' : 'all_borrows_report';
        link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page-container">
            <div className={styles.header}>
                <div>
                    <h1>รายงานและวิเคราะห์ 📊</h1>
                    <p>สถิติเชิงลึกและรายการที่ต้องติดตาม</p>
                </div>
                {activeTab !== 'top_items' && (
                    <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Download size={18} /> ออกรายงาน (CSV)
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => {
                    let count = null;
                    if (tab.id === 'overdue') count = overdueBorrows.length;
                    if (tab.id === 'all_history') count = borrows.length;
                    
                    return (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {count !== null && <span className={styles.tabCount}>{count}</span>}
                        </button>
                    );
                })}
            </div>

            <div className={styles.reportsContainer}>
                {/* Overdue Tab */}
                {activeTab === 'overdue' && (
                    <>
                        {overdueBorrows.length > 0 && (
                            <div className={styles.warningBanner}>
                                <AlertTriangle size={28} />
                                <div>
                                    <h3>พบรายการเกินกำหนด {overdueBorrows.length} รายการ</h3>
                                    <p>กรุณาติดต่อผู้ใช้งานเพื่อให้รีบนำอุปกรณ์มาคืน</p>
                                </div>
                            </div>
                        )}
                        
                        {overdueBorrows.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Package size={64} />
                                <h3>ไม่มีรายการค้างคืน</h3>
                                <p>ทุกคนคืนของตรงเวลา เยี่ยมมาก!</p>
                            </div>
                        ) : (
                            <div className={styles.listContainer}>
                                {overdueBorrows.map(borrow => {
                                    const item = items.find(i => i.id === borrow.itemId);
                                    return (
                                        <div key={borrow.id} className={styles.reportCard}>
                                            <div className={styles.reportCardLeft}>
                                                <div className={styles.itemIcon}>
                                                    {item?.image ? <img src={item.image} alt={item.name} /> : <Package size={24} />}
                                                </div>
                                                <div className={styles.details}>
                                                    <h3>{item?.name || borrow.itemName}</h3>
                                                    <div className={styles.meta}>
                                                        <span><User size={14} /> {borrow.borrowerName}</span>
                                                        <span className={styles.overdueText}>
                                                            <Calendar size={14} /> กำหนดคืน: {formatDate(borrow.dueDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="badge badge-unavailable">เกินกำหนด</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* All History Tab */}
                {activeTab === 'all_history' && (
                    <div className={styles.listContainer}>
                        {borrows.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)).map(borrow => {
                            const item = items.find(i => i.id === borrow.itemId);
                            const badge = getStatusBadge(borrow.status);
                            return (
                                <div key={borrow.id} className={styles.reportCard}>
                                    <div className={styles.reportCardLeft}>
                                        <div className={styles.itemIcon}>
                                            {item?.image ? <img src={item.image} alt={item.name} /> : <Package size={24} />}
                                        </div>
                                        <div className={styles.details}>
                                            <h3>{item?.name || borrow.itemName}</h3>
                                            <div className={styles.meta}>
                                                <span><User size={14} /> {borrow.borrowerName}</span>
                                                <span><Calendar size={14} /> ยืม: {formatDate(borrow.borrowDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Top Items Tab */}
                {activeTab === 'top_items' && (
                    <div className={styles.analyticsGrid}>
                        {topItems.map((entry, idx) => (
                            <div key={entry.item.id} className={styles.rankCard}>
                                <div className={styles.rankNumber}>{idx + 1}</div>
                                <div className={styles.itemIcon} style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
                                    {entry.item.image ? <img src={entry.item.image} alt={entry.item.name} /> : <Package size={20} />}
                                </div>
                                <div className={styles.rankInfo}>
                                    <h4>{entry.item.name}</h4>
                                    <p>ถูกยืมไป {entry.count} ครั้ง</p>
                                </div>
                                <div style={{ color: 'var(--primary-color)' }}>
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
