'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Grid3X3, List, Filter, Package } from 'lucide-react';
import { categories } from '@/data/mockData';
import { useData } from '@/context/DataContext';
import styles from './page.module.css';

export default function ItemsPage() {
    const { items } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
            return matchSearch && matchCategory && matchStatus;
        });
    }, [items, searchQuery, selectedCategory, selectedStatus]);

    const getCategoryIcon = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.icon : '📦';
    };

    const getStatusText = (status) => {
        const map = {
            available: 'ว่าง',
            borrowed: 'ถูกยืม',
            unavailable: 'ไม่พร้อม',
        };
        return map[status] || status;
    };

    const getStatusClass = (status) => {
        const map = {
            available: 'badge-available',
            borrowed: 'badge-borrowed',
            unavailable: 'badge-unavailable',
        };
        return map[status] || '';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>รายการของทั้งหมด</h1>
                <p>ค้นหาและเลือกของที่ต้องการยืม</p>
            </div>

            {/* Filters Bar */}
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

                <div className={styles.filters}>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={`input-field ${styles.select}`}
                    >
                        <option value="all">ทุกหมวดหมู่</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className={`input-field ${styles.select}`}
                    >
                        <option value="all">ทุกสถานะ</option>
                        <option value="available">ว่าง</option>
                        <option value="borrowed">ถูกยืม</option>
                        <option value="unavailable">ไม่พร้อม</option>
                    </select>

                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <p className={styles.resultCount}>
                พบ {filteredItems.length} รายการ
            </p>

            {/* Items Grid/List */}
            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <Package size={64} />
                    <h3>ไม่พบรายการ</h3>
                    <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid-items">
                    {filteredItems.map((item, index) => (
                        <Link
                            key={item.id}
                            href={`/items/${item.id}`}
                            className={`card ${styles.itemCard}`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className={styles.itemImageContainer}>
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className={styles.itemImageElement} loading="lazy" />
                                ) : (
                                    <div className={styles.itemImageFallback}>
                                        <span className={styles.itemEmoji}>{getCategoryIcon(item.category)}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.itemInfo}>
                                <div className={styles.itemTop}>
                                    <h3 className={styles.itemName}>{item.name}</h3>
                                    <span className={`badge ${getStatusClass(item.status)}`}>
                                        {getStatusText(item.status)}
                                    </span>
                                </div>
                                <p className={styles.itemDesc}>{item.description}</p>
                                <div className={styles.itemMeta}>
                                    <span>📍 {item.location}</span>
                                    <span>👤 {item.ownerName}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className={styles.listView}>
                    {filteredItems.map((item, index) => (
                        <Link
                            key={item.id}
                            href={`/items/${item.id}`}
                            className={`card ${styles.listItem}`}
                            style={{ animationDelay: `${index * 0.03}s` }}
                        >
                            <div className={styles.listItemImageContainer}>
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className={styles.listItemImage} loading="lazy" />
                                ) : (
                                    <div className={styles.listItemIcon}>
                                        {getCategoryIcon(item.category)}
                                    </div>
                                )}
                            </div>
                            <div className={styles.listItemInfo}>
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                            </div>
                            <div className={styles.listItemMeta}>
                                <span>📍 {item.location}</span>
                                <span>👤 {item.ownerName}</span>
                            </div>
                            <span className={`badge ${getStatusClass(item.status)}`}>
                                {getStatusText(item.status)}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
