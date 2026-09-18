'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, PlusCircle, Edit3, Trash2, Eye, Package } from 'lucide-react';
import { categories } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function AdminItemsPage() {
    const { items, deleteItem } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const filteredItems = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
        return matchSearch && matchCategory && matchStatus;
    });

    const getStatusText = (status) => {
        const map = { available: 'ว่าง', borrowed: 'ถูกยืม', unavailable: 'ไม่พร้อม', maintenance: '🛠️ ส่งซ่อม' };
        return map[status] || status;
    };

    const getStatusClass = (status) => {
        const map = { available: 'badge-available', borrowed: 'badge-borrowed', unavailable: 'badge-unavailable', maintenance: 'badge-unavailable' };
        return map[status] || '';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>จัดการของ</h1>
                    <p>เพิ่ม แก้ไข หรือลบรายการของในระบบ</p>
                </div>
                <Link href="/admin/items/new" className="btn btn-primary">
                    <PlusCircle size={18} /> เพิ่มของใหม่
                </Link>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาของ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field"
                    style={{ minWidth: '160px' }}
                >
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="input-field"
                    style={{ minWidth: '150px' }}
                >
                    <option value="all">ทุกสถานะ</option>
                    <option value="available">ว่าง</option>
                    <option value="borrowed">ถูกยืม</option>
                    <option value="maintenance">🛠️ ส่งซ่อม/ชำรุด</option>
                    <option value="unavailable">ไม่พร้อม</option>
                </select>
            </div>

            {/* Items Table */}
            <div className={`card ${styles.tableCard}`}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>รายการ</th>
                                <th>หมวดหมู่</th>
                                <th>สถานะ</th>
                                <th>สถานที่</th>
                                <th>เจ้าของ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const cat = categories.find(c => c.id === item.category);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className={styles.itemCell}>
                                                <div className={styles.itemThumb}>
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} />
                                                    ) : (
                                                        <span>{cat?.icon || '📦'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={styles.itemName}>{item.name}</p>
                                                    <span className={styles.itemId}>#{item.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.catBadge}>{cat?.icon} {cat?.name}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusClass(item.status)}`}>
                                                {getStatusText(item.status)}
                                            </span>
                                        </td>
                                        <td><span className={styles.locationText}>{item.location}</span></td>
                                        <td><span className={styles.ownerText}>{item.ownerName}</span></td>
                                        <td>
                                            <div className={styles.actionBtns}>
                                                <Link href={`/items/${item.id}`} className="btn-icon btn-secondary" title="ดู">
                                                    <Eye size={16} />
                                                </Link>
                                                <Link href={`/admin/items/edit/${item.id}`} className="btn-icon btn-secondary" title="แก้ไข">
                                                    <Edit3 size={16} />
                                                </Link>
                                                <button
                                                    className="btn-icon btn-secondary"
                                                    title="ลบ"
                                                    style={{ color: 'var(--danger)' }}
                                                    onClick={() => {
                                                        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${item.name}"?`)) {
                                                            deleteItem(item.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredItems.length === 0 && (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                        <Package size={48} />
                        <h3>ไม่พบรายการ</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
