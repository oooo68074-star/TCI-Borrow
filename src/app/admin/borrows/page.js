'use client';

import { useState } from 'react';
import {
    CheckCircle2, XCircle, Clock, Package,
    User, Calendar, Download, Wrench, AlertTriangle, X
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

const tabs = [
    { id: 'pending', label: 'รออนุมัติ' },
    { id: 'pending_return', label: 'รอตรวจรับคืน' },
    { id: 'active', label: 'กำลังยืม' },
    { id: 'overdue', label: 'เกินกำหนด' },
    { id: 'returned', label: 'คืนแล้ว' },
    { id: 'rejected', label: 'ปฏิเสธ' },
    { id: 'all', label: 'ทั้งหมด' },
];

export default function AdminBorrowsPage() {
    const { borrows, items, updateBorrowStatus } = useData();
    const [activeTab, setActiveTab] = useState('pending');

    // Maintenance / Damage modal state
    const [damageBorrow, setDamageBorrow] = useState(null);
    const [damageReason, setDamageReason] = useState('');
    const [damageCost, setDamageCost] = useState('');
    const [submittingDamage, setSubmittingDamage] = useState(false);

    const filtered = activeTab === 'all'
        ? borrows
        : activeTab === 'overdue'
            ? borrows.filter(b => b.status === 'active' && b.dueDate && new Date(b.dueDate) < new Date())
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

    const openDamageModal = (borrow) => {
        setDamageBorrow(borrow);
        setDamageReason(borrow.returnCondition === 'มีอาการชำรุด/เปิดไม่ติด' ? 'ผู้ยืมแจ้งว่าชำรุดตอนนำส่งคืน' : '');
        setDamageCost('');
    };

    const closeDamageModal = () => {
        setDamageBorrow(null);
    };

    const handleConfirmDamageReturn = async (e) => {
        e.preventDefault();
        if (!damageBorrow) return;

        setSubmittingDamage(true);
        try {
            await updateBorrowStatus(damageBorrow.id, 'returned', damageBorrow, {
                markMaintenance: true,
                maintenanceReason: damageReason || 'ชำรุดจากการยืมใช้งาน',
                maintenanceCost: Number(damageCost) || 0
            });
            closeDamageModal();
        } catch (err) {
            console.error("Error confirming damage return:", err);
            alert("เกิดข้อผิดพลาดในการบันทึกส่งซ่อม");
        } finally {
            setSubmittingDamage(false);
        }
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
            pending_return: { label: 'รอตรวจรับคืน', class: 'badge-pending' },
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>จัดการคำขอยืม</h1>
                    <p>อนุมัติ ปฏิเสธ ตรวจรับคืน และบันทึกการส่งซ่อม</p>
                </div>
                <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Download size={18} /> ออกรายงาน (CSV)
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map(tab => {
                    const count = tab.id === 'all' 
                        ? borrows.length 
                        : tab.id === 'overdue' 
                            ? borrows.filter(b => b.status === 'active' && b.dueDate && new Date(b.dueDate) < new Date()).length
                            : borrows.filter(b => b.status === tab.id).length;
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
                        const isOverdue = borrow.status === 'active' && borrow.dueDate && new Date(borrow.dueDate) < new Date();
                        const badge = { ...getStatusBadge(borrow.status) };
                        if (isOverdue) {
                            badge.label = 'เกินกำหนด';
                            badge.class = 'badge-unavailable';
                        }
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

                                        {/* User Return Notification Details */}
                                        {borrow.status === 'pending_return' && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px 14px',
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem'
                                            }}>
                                                <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Package size={15} /> ผู้ยืมแจ้งนำของมาวางคืนที่: {borrow.returnLocation || 'เคาน์เตอร์'}
                                                </div>
                                                <div>สภาพที่แจ้ง: <strong>{borrow.returnCondition || 'สมบูรณ์'}</strong></div>
                                                {borrow.returnNote && <div>หมายเหตุ: {borrow.returnNote}</div>}
                                                {borrow.returnRequestedAt && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                        เวลาที่แจ้ง: {new Date(borrow.returnRequestedAt).toLocaleString('th-TH')}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Show damage reported info if already returned with damage */}
                                        {borrow.damageReported && (
                                            <div style={{
                                                marginTop: '8px',
                                                fontSize: '0.8rem',
                                                color: '#ef4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <AlertTriangle size={14} />
                                                <span>บันทึกชำรุด: {borrow.damageReason} {borrow.damageCost ? `(ค่าซ่อม ฿${Number(borrow.damageCost).toLocaleString()})` : ''}</span>
                                            </div>
                                        )}
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

                                {borrow.status === 'pending_return' && (
                                    <div className={styles.actions} style={{ gap: '10px' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleReturn(borrow.id)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <CheckCircle2 size={16} /> ยืนยันรับคืนปกติ
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => openDamageModal(borrow)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}
                                        >
                                            <Wrench size={16} /> รับคืนพร้อมส่งซ่อม / ชำรุด
                                        </button>
                                    </div>
                                )}

                                {borrow.status === 'active' && (
                                    <div className={styles.actions} style={{ gap: '10px' }}>
                                        <button
                                            className={`btn btn-secondary ${styles.returnBtn}`}
                                            onClick={() => handleReturn(borrow.id)}
                                        >
                                            <Package size={16} /> รับคืนปกติ
                                        </button>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => openDamageModal(borrow)}
                                            style={{ color: '#f59e0b', fontSize: '0.85rem' }}
                                        >
                                            <Wrench size={14} /> รับคืนพร้อมส่งซ่อม
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Damage & Maintenance Modal */}
            {damageBorrow && (
                <div className="modal-overlay" onClick={closeDamageModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                                <Wrench size={22} /> รับคืนพร้อมบันทึกส่งซ่อม
                            </h2>
                            <button className="btn-icon btn-secondary" onClick={closeDamageModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmDamageReturn} style={{ marginTop: '16px' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                                อุปกรณ์: <strong>{damageBorrow.itemName}</strong> (ผู้ยืม: {damageBorrow.borrowerName})
                            </p>

                            <div style={{
                                padding: '10px 14px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                marginBottom: '16px',
                                color: 'var(--text-secondary)'
                            }}>
                                ℹ️ การกดยืนยันจะเปลี่ยนสถานะการยืมเป็น &ldquo;คืนแล้ว&rdquo; และจะปรับสถานะอุปกรณ์ในสต็อกเป็น <strong>&ldquo;🛠️ ส่งซ่อม / ชำรุด (Maintenance)&rdquo;</strong> ทันที เพื่อป้องกันไม่ให้คนอื่นยืมต่อจนกว่าจะซ่อมเสร็จ
                            </div>

                            <div className="input-group" style={{ marginBottom: '14px' }}>
                                <label>สาเหตุการชำรุด / อาการเสีย *</label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="เช่น หน้าจอมีรอยแตกร้าว, ช่องเสียบหลวม, เลนส์มัว..."
                                    value={damageReason}
                                    onChange={(e) => setDamageReason(e.target.value)}
                                    required
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label>ประเมินค่าซ่อม / ค่าเสียหาย (บาท)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="input-field"
                                    placeholder="เช่น 500"
                                    value={damageCost}
                                    onChange={(e) => setDamageCost(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeDamageModal} disabled={submittingDamage}>
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submittingDamage}
                                    style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                                >
                                    {submittingDamage ? 'กำลังบันทึก...' : 'ยืนยันรับคืน & ส่งซ่อม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
