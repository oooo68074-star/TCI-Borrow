'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Clock, CheckCircle2, XCircle, Package,
    AlertCircle, ArrowLeftRight, MapPin, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'active', label: 'กำลังยืม' },
    { id: 'pending_return', label: 'รอตรวจรับคืน' },
    { id: 'pending', label: 'รออนุมัติ' },
    { id: 'returned', label: 'คืนแล้ว' },
    { id: 'rejected', label: 'ถูกปฏิเสธ' },
];

export default function MyBorrowsPage() {
    const { user } = useAuth();
    const { items: allItems, borrows, notifyReturnBorrow } = useData();
    const [activeTab, setActiveTab] = useState('all');

    // Return Notice Modal State
    const [selectedBorrow, setSelectedBorrow] = useState(null);
    const [returnForm, setReturnForm] = useState({
        location: 'เคาน์เตอร์พัสดุ',
        customLocation: '',
        condition: 'สภาพสมบูรณ์ปกติ',
        note: ''
    });
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const [successNotice, setSuccessNotice] = useState('');

    const myBorrows = borrows.filter(b => b.borrowerId === user?.id);
    const filtered = activeTab === 'all'
        ? myBorrows
        : myBorrows.filter(b => b.status === activeTab);

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'กำลังยืม', class: 'badge-borrowed', icon: <Package size={14} /> },
            pending_return: { label: 'รอตรวจรับคืน', class: 'badge-pending', icon: <Clock size={14} /> },
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

    const openReturnModal = (borrow) => {
        setSelectedBorrow(borrow);
        setReturnForm({
            location: 'เคาน์เตอร์พัสดุ',
            customLocation: '',
            condition: 'สภาพสมบูรณ์ปกติ',
            note: ''
        });
    };

    const closeReturnModal = () => {
        setSelectedBorrow(null);
    };

    const handleConfirmReturn = async (e) => {
        e.preventDefault();
        if (!selectedBorrow) return;

        setSubmittingReturn(true);
        try {
            const finalLocation = returnForm.location === 'อื่นๆ'
                ? (returnForm.customLocation || 'ระบุสถานที่อื่น')
                : returnForm.location;

            await notifyReturnBorrow(selectedBorrow.id, {
                location: finalLocation,
                condition: returnForm.condition,
                note: returnForm.note
            });

            setSuccessNotice(`แจ้งคืน "${selectedBorrow.itemName}" สำเร็จ! กรุณารอแอดมินตรวจรับของ`);
            closeReturnModal();
            setTimeout(() => setSuccessNotice(''), 5000);
        } catch (err) {
            console.error("Error submitting return notice:", err);
            alert("เกิดข้อผิดพลาดในการแจ้งส่งคืน");
        } finally {
            setSubmittingReturn(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>รายการยืมของฉัน</h1>
                <p>ติดตามสถานะคำขอยืมและของที่กำลังยืมอยู่</p>
            </div>

            {successNotice && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem'
                }}>
                    <CheckCircle2 size={18} />
                    <span>{successNotice}</span>
                </div>
            )}

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
                            <div
                                key={borrow.id}
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
                                    <Link href={`/items/${borrow.itemId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3>{item?.name || borrow.itemName}</h3>
                                    </Link>
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

                                    {/* Action button for active borrows */}
                                    {borrow.status === 'active' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => openReturnModal(borrow)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <ArrowLeftRight size={14} /> แจ้งส่งคืนของ
                                            </button>
                                        </div>
                                    )}

                                    {/* Pending Return Details */}
                                    {borrow.status === 'pending_return' && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '8px 12px',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600, marginBottom: '2px' }}>
                                                <Clock size={14} /> นำส่งคืนที่: {borrow.returnLocation || 'เคาน์เตอร์'}
                                            </div>
                                            <div>สภาพที่แจ้ง: {borrow.returnCondition || 'ปกติ'}</div>
                                            {borrow.returnNote && <div>หมายเหตุ: {borrow.returnNote}</div>}
                                            <div style={{ fontSize: '0.75rem', marginTop: '2px', color: 'var(--text-muted)' }}>
                                                (รอแอดมินตรวจสอบและกดยืนยันรับคืน)
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className={`badge ${badge.class} ${styles.statusBadge}`}>
                                    {badge.icon} {badge.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Return Notice Modal */}
            {selectedBorrow && (
                <div className="modal-overlay" onClick={closeReturnModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>แจ้งส่งคืนของ 📦</h2>
                            <button className="btn-icon btn-secondary" onClick={closeReturnModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReturn} style={{ marginTop: '16px' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                อุปกรณ์: <strong>{selectedBorrow.itemName}</strong>
                            </p>

                            <div className="input-group" style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={16} /> สถานที่นำของไปวางคืน *
                                </label>
                                <select
                                    className="input-field"
                                    value={returnForm.location}
                                    onChange={(e) => setReturnForm(prev => ({ ...prev, location: e.target.value }))}
                                >
                                    <option value="เคาน์เตอร์พัสดุ">เคาน์เตอร์พัสดุกลาง</option>
                                    <option value="โต๊ะอาจารย์ประจำห้องแล็บ">โต๊ะอาจารย์ประจำห้องแล็บ</option>
                                    <option value="ตู้ล็อกเกอร์รับคืน">ตู้ล็อกเกอร์รับคืน</option>
                                    <option value="อื่นๆ">ระบุสถานที่อื่น...</option>
                                </select>
                            </div>

                            {returnForm.location === 'อื่นๆ' && (
                                <div className="input-group" style={{ marginBottom: '14px' }}>
                                    <label>ระบุสถานที่วางของ *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="เช่น ห้อง 402 ตึกคอม..."
                                        value={returnForm.customLocation}
                                        onChange={(e) => setReturnForm(prev => ({ ...prev, customLocation: e.target.value }))}
                                        required
                                    />
                                </div>
                            )}

                            <div className="input-group" style={{ marginBottom: '14px' }}>
                                <label>สภาพอุปกรณ์ตอนส่งคืน *</label>
                                <select
                                    className="input-field"
                                    value={returnForm.condition}
                                    onChange={(e) => setReturnForm(prev => ({ ...prev, condition: e.target.value }))}
                                >
                                    <option value="สภาพสมบูรณ์ปกติ">สภาพสมบูรณ์ปกติ ใช้งานได้ดี</option>
                                    <option value="มีตำหนิ/รอยขีดข่วนเล็กน้อย">มีตำหนิ / รอยขีดข่วนเล็กน้อย</option>
                                    <option value="มีอาการชำรุด/เปิดไม่ติด">มีอาการชำรุด / ชิ้นส่วนเสียหาย</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ marginBottom: '20px' }}>
                                <label>หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="เช่น วางไว้ในกล่องเดิมพร้อมสายชาร์จ..."
                                    value={returnForm.note}
                                    onChange={(e) => setReturnForm(prev => ({ ...prev, note: e.target.value }))}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeReturnModal} disabled={submittingReturn}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submittingReturn}>
                                    {submittingReturn ? 'กำลังส่งข้อมูล...' : 'ยืนยันการแจ้งคืน'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
