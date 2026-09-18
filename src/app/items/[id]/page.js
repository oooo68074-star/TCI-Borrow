'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, MapPin, User, Calendar, Clock, Tag,
    Heart, Share2, AlertCircle, CheckCircle2, X, QrCode, Wrench
} from 'lucide-react';
import { categories } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function ItemDetailPage() {
    const { user, isAdmin } = useAuth();
    const { items, borrows, addBorrowRequest, resolveItemMaintenance } = useData();
    const params = useParams();
    const router = useRouter();
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [borrowNote, setBorrowNote] = useState('');
    const [borrowDays, setBorrowDays] = useState(7);
    const [borrowQuantity, setBorrowQuantity] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [resolvingMaintenance, setResolvingMaintenance] = useState(false);

    const item = items.find(i => i.id === params.id);
    const itemBorrows = borrows.filter(b => b.itemId === params.id);

    if (!item) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <h3>ไม่พบรายการของ</h3>
                    <p>ของที่คุณกำลังค้นหาอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
                    <Link href="/items" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        กลับหน้ารายการของ
                    </Link>
                </div>
            </div>
        );
    }

    const category = categories.find(c => c.id === item.category);

    const currentAvailableQty = item.availableQuantity !== undefined ? item.availableQuantity : (item.quantity || 1);

    const getStatusText = (status) => {
        const map = {
            available: 'ว่าง',
            borrowed: 'ถูกยืม',
            unavailable: 'ไม่พร้อมใช้งาน',
            maintenance: '🛠️ กำลังส่งซ่อม / ชำรุด'
        };
        return map[status] || status;
    };

    const getStatusClass = (status) => {
        const map = {
            available: 'badge-available',
            borrowed: 'badge-borrowed',
            unavailable: 'badge-unavailable',
            maintenance: 'badge-unavailable'
        };
        return map[status] || '';
    };

    const handleResolveMaintenance = async () => {
        if (!confirm('ต้องการเปลี่ยนสถานะอุปกรณ์นี้เป็น "ว่าง / พร้อมใช้งาน" หรือไม่?')) return;
        setResolvingMaintenance(true);
        try {
            await resolveItemMaintenance(item.id);
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        } finally {
            setResolvingMaintenance(false);
        }
    };

    const formatDate = (str) => new Date(str).toLocaleDateString('th-TH', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const handleBorrow = () => {
        setSubmitted(true);

        // Add to global state
        addBorrowRequest({
            itemId: item.id,
            itemName: item.name,
            ownerId: item.ownerId,
            ownerName: item.ownerName || 'แอดมิน',
            borrowerId: user.id,
            borrowerName: user.name,
            borrowerEmail: user.email,
            borrowerDept: user.department,
            note: borrowNote,
            expectedReturnDays: borrowDays,
            quantity: borrowQuantity,
        });

        setTimeout(() => {
            setShowBorrowModal(false);
            setSubmitted(false);
            setBorrowNote('');
            router.push('/my-borrows');
        }, 1500);
    };

    return (
        <div className="page-container">
            {/* Back Button */}
            <button className={`btn btn-ghost ${styles.backBtn}`} onClick={() => router.back()}>
                <ArrowLeft size={18} /> กลับ
            </button>

            <div className={styles.detailGrid}>
                {/* Image Section */}
                <div className={styles.imageSection}>
                    <div className={styles.mainImage}>
                        {item.image ? (
                            <img src={item.image} alt={item.name} className={styles.fullImage} />
                        ) : (
                            <span className={styles.emoji}>{category?.icon || '📦'}</span>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className={styles.infoSection}>
                    <div className={styles.infoHeader}>
                        <div>
                            <span className={`badge ${getStatusClass(item.status)}`}>
                                {getStatusText(item.status)}
                            </span>
                            <h1 className={styles.itemTitle}>{item.name}</h1>
                        </div>
                        <div className={styles.actions}>
                            <button className="btn-icon btn-secondary" onClick={() => setShowQrModal(true)} title="แชร์ QR Code">
                                <QrCode size={18} />
                            </button>
                            <button className="btn-icon btn-secondary" title="ชื่นชอบ">
                                <Heart size={18} />
                            </button>
                        </div>
                    </div>

                    <p className={styles.description}>{item.description}</p>

                    <div className={styles.metaList}>
                        <div className={styles.metaItem}>
                            <Tag size={16} />
                            <span>หมวดหมู่: {category?.name || 'ไม่ระบุ'}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <MapPin size={16} />
                            <span>สถานที่: {item.location}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <User size={16} />
                            <span>เจ้าของ: {item.ownerName}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <CheckCircle2 size={16} />
                            <span>สภาพ: {item.condition}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <Tag size={16} />
                            <span>จำนวนรวม: {item.quantity || 1} ชิ้น (ว่าง {currentAvailableQty} ชิ้น)</span>
                        </div>
                        <div className={styles.metaItem}>
                            <Calendar size={16} />
                            <span>เพิ่มเมื่อ: {formatDate(item.createdAt)}</span>
                        </div>
                    </div>

                    {/* Borrow Button */}
                    {item.status === 'available' && item.ownerId !== user?.id && (
                        <button
                            className={`btn btn-primary btn-lg ${styles.borrowBtn}`}
                            onClick={() => setShowBorrowModal(true)}
                        >
                            ขอยืม
                        </button>
                    )}

                    {item.ownerId === user?.id && (
                        <div className={styles.ownerNote}>
                            <AlertCircle size={16} />
                            <span>นี่คือของของคุณ</span>
                        </div>
                    )}

                    {item.status === 'borrowed' && (
                        <div className={styles.borrowedNote}>
                            <Clock size={16} />
                            <span>ของชิ้นนี้ถูกยืมอยู่ในขณะนี้</span>
                        </div>
                    )}

                    {item.status === 'maintenance' && (
                        <div className={styles.maintenanceBanner}>
                            <div className={styles.maintenanceHeader}>
                                <Wrench size={18} />
                                <strong>อุปกรณ์นี้อยู่ระหว่างการส่งซ่อมบำรุง / ชำรุด</strong>
                            </div>
                            {item.maintenanceReason && (
                                <p className={styles.maintenanceText}>
                                    <strong>อาการ/สาเหตุ:</strong> {item.maintenanceReason}
                                </p>
                            )}
                            {item.maintenanceCost ? (
                                <p className={styles.maintenanceText}>
                                    <strong>ประเมินค่าซ่อม/ค่าเสียหาย:</strong> ฿{Number(item.maintenanceCost).toLocaleString()}
                                </p>
                            ) : null}
                            {isAdmin && (
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={handleResolveMaintenance}
                                    disabled={resolvingMaintenance}
                                    style={{ marginTop: '12px' }}
                                >
                                    <CheckCircle2 size={16} /> {resolvingMaintenance ? 'กำลังอัปเดต...' : 'ซ่อมเสร็จแล้ว (เปลี่ยนเป็นพร้อมใช้งาน)'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Borrow History */}
            <div className={`card ${styles.historySection}`}>
                <h2>ประวัติการยืม</h2>
                {itemBorrows.length === 0 ? (
                    <p className={styles.noHistory}>ยังไม่มีประวัติการยืม</p>
                ) : (
                    <div className={styles.historyList}>
                        {itemBorrows.map(borrow => (
                            <div key={borrow.id} className={styles.historyItem}>
                                <div className="avatar avatar-sm">
                                    {borrow.borrowerName[0]}
                                </div>
                                <div className={styles.historyInfo}>
                                    <p><strong>{borrow.borrowerName}</strong></p>
                                    <span>{formatDate(borrow.borrowDate)} — {borrow.returnDate ? formatDate(borrow.returnDate) : 'ยังไม่คืน'}</span>
                                </div>
                                <span className={`badge badge-${borrow.status === 'returned' ? 'available' : borrow.status === 'active' ? 'borrowed' : 'pending'}`}>
                                    {borrow.status === 'returned' ? 'คืนแล้ว' : borrow.status === 'active' ? 'กำลังยืม' : 'รอดำเนินการ'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Borrow Modal */}
            {showBorrowModal && (
                <div className="modal-overlay" onClick={() => !submitted && setShowBorrowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        {submitted ? (
                            <div className={styles.successMessage}>
                                <CheckCircle2 size={48} className={styles.successIcon} />
                                <h2>ส่งคำขอยืมสำเร็จ!</h2>
                                <p>รอเจ้าของอนุมัติคำขอของคุณ</p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <h2>ขอยืม {item.name}</h2>
                                    <button className="btn-icon" onClick={() => setShowBorrowModal(false)}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className={styles.modalForm}>
                                    <div className="input-group">
                                        <label>จำนวนที่ต้องการยืม (ว่าง {currentAvailableQty} ชิ้น)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={currentAvailableQty}
                                            value={borrowQuantity}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                if (val > 0 && val <= currentAvailableQty) {
                                                    setBorrowQuantity(val);
                                                }
                                            }}
                                            className="input-field"
                                            style={{ marginBottom: '12px' }}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label>จำนวนวันที่ต้องการยืม</label>
                                        <select
                                            value={borrowDays}
                                            onChange={(e) => setBorrowDays(Number(e.target.value))}
                                            className="input-field"
                                        >
                                            <option value={1}>1 วัน</option>
                                            <option value={3}>3 วัน</option>
                                            <option value={7}>7 วัน</option>
                                            <option value={14}>14 วัน</option>
                                            <option value={30}>30 วัน</option>
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label>หมายเหตุ (ไม่บังคับ)</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="ระบุเหตุผลหรือรายละเอียดเพิ่มเติม..."
                                            value={borrowNote}
                                            onChange={(e) => setBorrowNote(e.target.value)}
                                            rows={3}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    <button className="btn btn-primary btn-lg" onClick={handleBorrow} style={{ width: '100%', marginTop: '8px' }}>
                                        ยืนยันคำขอยืม
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQrModal && (
                <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div className="modal-header">
                            <h2>สแกนเพื่อเข้าสู่หน้านี้</h2>
                            <button onClick={() => setShowQrModal(false)} className="btn-icon btn-secondary">
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                                alt="Item QR Code"
                                width="200"
                                height="200"
                                style={{ borderRadius: '8px' }}
                            />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            เพื่อนของคุณสามารถใช้กล้องโทรศัพท์แสกน QR Code นี้<br />
                            เพื่อเด้งเข้ามาขอยืมสิ่งของชิ้นนี้ได้ทันที 📷
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
