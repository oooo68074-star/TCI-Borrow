'use client';

import Link from 'next/link';
import { Package, ArrowLeftRight, Clock, TrendingUp, Search, ChevronRight } from 'lucide-react';
import { categories } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const { items, borrows } = useData();

  const myBorrows = borrows.filter(b => b.borrowerId === user?.id);
  const activeBorrows = myBorrows.filter(b => b.status === 'active');
  const pendingBorrows = myBorrows.filter(b => b.status === 'pending');
  const availableItems = items.filter(i => i.status === 'available');
  const recentItems = availableItems.slice(0, 6);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>สวัสดี, {user?.name || 'ผู้ใช้'} 👋</h1>
        <p>ยินดีต้อนรับเข้าสู่ BorrowHub — ค้นหาของที่คุณต้องการยืม</p>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <ArrowLeftRight size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{activeBorrows.length}</span>
            <span className={styles.statLabel}>กำลังยืมอยู่</span>
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <Clock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{pendingBorrows.length}</span>
            <span className={styles.statLabel}>รออนุมัติ</span>
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <Package size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{availableItems.length}</span>
            <span className={styles.statLabel}>ของว่างให้ยืม</span>
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{myBorrows.length}</span>
            <span className={styles.statLabel}>ยืมทั้งหมด</span>
          </div>
        </div>
      </div>

      {/* Active Borrows */}
      {activeBorrows.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📦 ของที่กำลังยืมอยู่</h2>
            <Link href="/my-borrows" className={styles.seeAll}>
              ดูทั้งหมด <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.activeBorrowsList}>
            {activeBorrows.map(borrow => {
              const item = items.find(i => i.id === borrow.itemId);
              return (
                <div key={borrow.id} className={`card ${styles.borrowCard}`}>
                  <div className={styles.borrowImage}>
                    {item?.image ? (
                      <img src={item.image} alt={item?.name} />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className={styles.borrowInfo}>
                    <h3>{item?.name || borrow.itemName}</h3>
                    <p>เจ้าของ: {borrow.ownerName}</p>
                    <span className={styles.dueDate}>
                      <Clock size={14} />
                      {borrow.dueDate
                        ? `คืนภายใน: ${new Date(borrow.dueDate).toLocaleDateString('th-TH')}`
                        : `แจ้งคืนใน ${borrow.expectedReturnDays || 7} วัน`}
                    </span>
                  </div>
                  <span className="badge badge-borrowed">กำลังยืม</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingBorrows.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>⏳ คำขอที่รออนุมัติ</h2>
          </div>
          <div className={styles.activeBorrowsList}>
            {pendingBorrows.map(borrow => {
              const item = items.find(i => i.id === borrow.itemId);
              return (
                <div key={borrow.id} className={`card ${styles.borrowCard}`}>
                  <div className={styles.borrowImage}>
                    {item?.image ? (
                      <img src={item.image} alt={item?.name} />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className={styles.borrowInfo}>
                    <h3>{item?.name || borrow.itemName}</h3>
                    <p>เจ้าของ: {borrow.ownerName}</p>
                  </div>
                  <span className="badge badge-pending">รออนุมัติ</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Browse Items */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>🔥 ของที่พร้อมให้ยืม</h2>
          <Link href="/items" className={styles.seeAll}>
            ดูทั้งหมด <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid-items">
          {recentItems.map((item, index) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className={`card ${styles.itemCard}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={styles.itemImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" />
                ) : (
                  <span className={styles.itemEmoji}>
                    {categories.find(c => c.id === item.category)?.icon || '📦'}
                  </span>
                )}
              </div>
              <div className={styles.itemInfo}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className={styles.itemMeta}>
                  <span>📍 {item.location}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
